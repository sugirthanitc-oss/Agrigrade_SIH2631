import os
import sys
from PIL import Image
import cv2
from ultralytics import YOLO


def resolve_path(relative_paths):
    """Finds the first existing path from a list of candidates."""
    for p in relative_paths:
        if os.path.exists(p):
            return os.path.abspath(p)
    return os.path.abspath(relative_paths[0])


def main():
    # 1. Resolve model path (supports running from root or ai/ directory)
    model_candidates = [
        "ai/models/best.pt",
        "models/best.pt",
        "../ai/models/best.pt",
        "ai/weights/best.pt",
        "weights/best.pt",
    ]
    model_path = resolve_path(model_candidates)

    if not os.path.exists(model_path):
        print(f"[Error] Model file not found at: {model_path}")
        print("Please ensure your trained 'best.pt' is in 'ai/models/best.pt'.")
        sys.exit(1)

    # 2. Resolve input image path
    image_candidates = [
        sys.argv[1] if len(sys.argv) > 1 else "test_onion.jpg",
        "ai/test_onion.jpg",
        "../test_onion.jpg",
    ]
    image_path = resolve_path(image_candidates)

    if not os.path.exists(image_path):
        print(f"[Error] Test image not found at: {image_path}")
        print("Please place a 'test_onion.jpg' in the directory or specify a path.")
        sys.exit(1)

    output_path = "prediction.jpg"

    print("=" * 60)
    print(" ONION QUALITY AI - MODEL INFERENCE TEST")
    print("=" * 60)
    print(f"Loading Model : {model_path}")
    print(f"Input Image   : {image_path}")
    print(f"Output Target : {output_path}")
    print("-" * 60)

    # 3. Load YOLO model
    model = YOLO(model_path)

    # 4. Run inference
    results = model.predict(source=image_path, save=False, verbose=False)

    if not results:
        print("[Error] No results returned from inference.")
        sys.exit(1)

    result = results[0]
    model_names = result.names if hasattr(result, "names") else {}

    # 5. Extract and display detections
    boxes = result.boxes
    probs = getattr(result, "probs", None)

    total_detections = 0

    print("\nDETECTION RESULTS:")
    print("-" * 60)

    if boxes is not None and len(boxes) > 0:
        # Object Detection Output (YOLO Detect)
        total_detections = len(boxes)
        print(f"{'#':<4} | {'Class Name':<15} | {'Confidence':<12} | {'Bounding Box [x1, y1, x2, y2]'}")
        print("-" * 60)

        for idx, box in enumerate(boxes):
            cls_id = int(box.cls[0].item())
            class_name = model_names.get(cls_id, f"class_{cls_id}")
            confidence = float(box.conf[0].item())
            xyxy = [round(float(c), 1) for c in box.xyxy[0].tolist()]

            print(f"{idx + 1:<4} | {class_name:<15} | {confidence:.4f} ({confidence * 100:.1f}%) | {xyxy}")

    elif probs is not None:
        # Classification Output (YOLO Classify)
        total_detections = 1
        top1_id = int(probs.top1)
        top1_name = model_names.get(top1_id, f"class_{top1_id}")
        top1_conf = float(probs.top1conf.item())

        orig_h, orig_w = result.orig_shape if hasattr(result, "orig_shape") else (224, 224)
        full_box = [0.0, 0.0, float(orig_w), float(orig_h)]

        print(f"{'#':<4} | {'Class Name':<15} | {'Confidence':<12} | {'Bounding Box (Full Frame)'}")
        print("-" * 60)
        print(f"{1:<4} | {top1_name:<15} | {top1_conf:.4f} ({top1_conf * 100:.1f}%) | {full_box}")

        print("\nAll Class Probabilities:")
        for cls_id, cls_name in model_names.items():
            conf = float(probs.data[cls_id].item()) if hasattr(probs, "data") else 0.0
            print(f"  • {cls_name:<15}: {conf:.4f} ({conf * 100:.2f}%)")

    else:
        print("No detections or classification output found.")

    print("-" * 60)
    print(f"TOTAL DETECTIONS: {total_detections}")
    print("=" * 60)

    # 6. Save annotated image as prediction.jpg
    try:
        annotated_bgr = result.plot()
        annotated_rgb = cv2.cvtColor(annotated_bgr, cv2.COLOR_BGR2RGB)
        pil_img = Image.fromarray(annotated_rgb)
        pil_img.save(output_path, "JPEG", quality=95)
        print(f"\n[Success] Annotated prediction saved to: {os.path.abspath(output_path)}")
    except Exception as e:
        print(f"[Warning] Failed to save plot via PIL: {e}")
        try:
            cv2.imwrite(output_path, annotated_bgr)
            print(f"[Success] Annotated prediction saved via OpenCV to: {os.path.abspath(output_path)}")
        except Exception as e2:
            print(f"[Error] Could not save annotated image: {e2}")


if __name__ == "__main__":
    main()
