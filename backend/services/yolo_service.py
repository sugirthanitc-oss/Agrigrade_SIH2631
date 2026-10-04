import os
import cv2
import numpy as np
from typing import Dict, Tuple, List, Optional, Any
from fastapi import HTTPException
from PIL import Image, ImageOps

try:
    from ultralytics import YOLO
except ImportError:
    YOLO = None

DEFAULT_MODEL_PATH = os.path.normpath(
    os.path.join(os.path.dirname(__file__), "..", "..", "ai", "models", "best.pt")
)
FALLBACK_MODEL_PATH = os.path.normpath(
    os.path.join(os.path.dirname(__file__), "..", "..", "ai", "weights", "best.pt")
)

# Standard target 5 classes
CANONICAL_CLASSES = ["healthy", "damaged", "rotten", "sprouted", "undersized"]


def assess_image_quality(img_cv: np.ndarray) -> Dict[str, Any]:
    """
    Evaluates image brightness, blurriness, and dimensions before inference.
    Returns quality metrics and an 'is_valid' flag with reason if unusable.
    """
    h, w = img_cv.shape[:2]
    if h < 120 or w < 120:
        return {
            "is_valid": False,
            "status": "too_small",
            "message": "Image resolution is too low for reliable onion inspection (minimum 120x120 required)."
        }

    gray = cv2.cvtColor(img_cv, cv2.COLOR_BGR2GRAY)
    mean_brightness = float(np.mean(gray))
    # Laplacian variance for blur detection
    blur_score = float(cv2.Laplacian(gray, cv2.CV_64F).var())

    if mean_brightness < 20:
        return {
            "is_valid": False,
            "status": "too_dark",
            "brightness": round(mean_brightness, 1),
            "blur_score": round(blur_score, 1),
            "message": "Lighting is too dark for accurate computer vision inspection. Please capture in brighter lighting."
        }
    if mean_brightness > 250:
        return {
            "is_valid": False,
            "status": "overexposed",
            "brightness": round(mean_brightness, 1),
            "blur_score": round(blur_score, 1),
            "message": "Image is severely overexposed/washed out. Please reposition lighting."
        }

    # Severe motion blur check (only reject if extremely degraded, < 8.0)
    if blur_score < 8.0:
        return {
            "is_valid": False,
            "status": "severe_blur",
            "brightness": round(mean_brightness, 1),
            "blur_score": round(blur_score, 1),
            "message": "Image is severely blurred. Please hold the camera steady and capture again."
        }

    return {
        "is_valid": True,
        "status": "optimal",
        "brightness": round(mean_brightness, 1),
        "blur_score": round(blur_score, 1),
        "dimensions": f"{w}x{h}"
    }


class YOLOInferenceEngine:
    _instance = None
    _model = None
    _model_path: str = ""

    @classmethod
    def get_instance(cls):
        if cls._instance is None:
            cls._instance = YOLOInferenceEngine()
        return cls._instance

    def __init__(self):
        self._load_model()

    def _resolve_model_path(self) -> str:
        env_path = os.getenv("YOLO_MODEL_PATH")
        if env_path:
            norm_env = os.path.normpath(os.path.join(os.path.dirname(__file__), "..", env_path))
            if os.path.exists(norm_env):
                return norm_env
            if os.path.exists(env_path):
                return env_path

        if os.path.exists(DEFAULT_MODEL_PATH):
            return DEFAULT_MODEL_PATH

        if os.path.exists(FALLBACK_MODEL_PATH):
            return FALLBACK_MODEL_PATH

        return DEFAULT_MODEL_PATH

    def _load_model(self):
        if YOLO is None:
            return

        resolved_path = self._resolve_model_path()
        self._model_path = resolved_path

        if os.path.exists(resolved_path):
            try:
                self._model = YOLO(resolved_path)
                print(f"[YOLO Engine] Loaded model from {resolved_path} (Task: {self._model.task})")
            except Exception as e:
                print(f"[Warning] Failed to initialize YOLO model from {resolved_path}: {e}")
                self._model = None
        else:
            self._model = None

    def is_loaded(self) -> bool:
        return self._model is not None

    def get_model_path(self) -> str:
        return self._model_path

    def get_class_names(self) -> Dict[int, str]:
        if self._model and hasattr(self._model, "names"):
            return self._model.names
        return {i: name for i, name in enumerate(CANONICAL_CLASSES)}

    def run_inference(
        self,
        image_path: str,
        conf_threshold: float = 0.25,
        iou_threshold: float = 0.45
    ) -> Tuple[Dict[str, int], int, str, List[dict], Dict[str, Any], Optional[str]]:
        """
        Runs real YOLO inference on the uploaded image.
        
        Returns:
          (category_counts, total_count, annotated_image_path, detections_list, quality_check, status_message)
        """
        if YOLO is None:
            raise HTTPException(
                status_code=500,
                detail="Ultralytics YOLO package is not installed."
            )

        if not self._model:
            self._load_model()

        if not self._model:
            raise HTTPException(
                status_code=503,
                detail=f"Trained YOLO weights file not found at '{self._model_path}'."
            )

        # 1. Preprocess & check EXIF orientation using PIL
        try:
            with Image.open(image_path) as pil_raw:
                pil_transposed = ImageOps.exif_transpose(pil_raw)
                img_rgb = pil_transposed.convert("RGB")
                img_cv = cv2.cvtColor(np.array(img_rgb), cv2.COLOR_RGB2BGR)
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Failed to read image file: {str(e)}")

        orig_h, orig_w = img_cv.shape[:2]
        file_size_kb = round(os.path.getsize(image_path) / 1024, 1)
        print(f"[Inference Input] Dimensions: {orig_w}x{orig_h} | Size: {file_size_kb} KB")

        # 2. Quality check
        quality = assess_image_quality(img_cv)
        if not quality["is_valid"]:
            # Image is severely dark, overexposed, or blurred
            raise HTTPException(
                status_code=422,
                detail=quality["message"]
            )

        # 3. Execute YOLO inference
        try:
            results = self._model.predict(
                source=img_cv,
                conf=conf_threshold,
                iou=iou_threshold,
                save=False,
                verbose=False
            )
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error executing YOLO inference: {str(e)}")

        if not results:
            raise HTTPException(status_code=500, detail="Inference returned empty result.")

        result = results[0]
        model_names = result.names if hasattr(result, "names") else self.get_class_names()

        counts: Dict[str, int] = {c: 0 for c in CANONICAL_CLASSES}
        detections: List[dict] = []
        status_message = None

        boxes = result.boxes
        if boxes is not None and len(boxes) > 0:
            for idx, box in enumerate(boxes):
                cls_id = int(box.cls[0].item())
                confidence = float(box.conf[0].item())
                coords = [round(float(c), 1) for c in box.xyxy[0].tolist()]

                raw_name = str(model_names.get(cls_id, cls_id)).lower().strip()

                matched_category = None
                for c in CANONICAL_CLASSES:
                    if c in raw_name:
                        matched_category = c
                        break

                if not matched_category:
                    if "rotten" in raw_name:
                        matched_category = "rotten"
                    elif "damage" in raw_name:
                        matched_category = "damaged"
                    elif "sprout" in raw_name:
                        matched_category = "sprouted"
                    elif "under" in raw_name:
                        matched_category = "undersized"
                    elif 0 <= cls_id < len(CANONICAL_CLASSES):
                        matched_category = CANONICAL_CLASSES[cls_id]
                    else:
                        matched_category = "damaged"

                counts[matched_category] += 1
                detections.append({
                    "id": idx + 1,
                    "class": matched_category,
                    "class_name": matched_category,
                    "confidence": round(confidence, 3),
                    "bbox": coords
                })

        elif hasattr(result, "probs") and result.probs is not None:
            # Fallback for classification weights if classification model is active
            top1_id = int(result.probs.top1)
            top1_conf = float(result.probs.top1conf.item())
            raw_name = str(model_names.get(top1_id, top1_id)).lower().strip()

            matched_category = "healthy"
            for c in CANONICAL_CLASSES:
                if c in raw_name:
                    matched_category = c
                    break

            counts[matched_category] += 1
            detections.append({
                "id": 1,
                "class": matched_category,
                "class_name": matched_category,
                "confidence": round(top1_conf, 3),
                "bbox": [0.0, 0.0, float(orig_w), float(orig_h)]
            })

        total_detected = sum(counts.values())

        if total_detected == 0:
            status_message = "Unable to detect onions. Please place the onions clearly inside the inspection area and try again."

        # 4. Generate annotated image with bounding boxes
        annotated_path = self._generate_annotated_image(result, image_path)

        return counts, total_detected, annotated_path, detections, quality, status_message

    def _generate_annotated_image(self, result, original_path: str) -> str:
        """Saves annotated image with bounding box visualization."""
        try:
            rendered_bgr = result.plot()
            base, _ = os.path.splitext(original_path)
            annotated_path = f"{base}_annotated.jpg"

            rendered_rgb = cv2.cvtColor(rendered_bgr, cv2.COLOR_BGR2RGB)
            pil_img = Image.fromarray(rendered_rgb)
            pil_img.save(annotated_path, "JPEG", quality=90)
            return annotated_path
        except Exception:
            return original_path


yolo_engine = YOLOInferenceEngine.get_instance()
