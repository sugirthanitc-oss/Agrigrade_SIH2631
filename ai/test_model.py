import os
import glob
import cv2
import numpy as np
from PIL import Image
from ultralytics import YOLO

MODEL_PATH = "ai/models/best.pt"
VAL_IMAGES_DIR = "dataset/images/val"
RESULTS_DIR = "ai/test_results"

def test_model():
    print("=" * 70)
    print(" ONION QUALITY AI - STANDALONE MODEL VALIDATION TEST")
    print("=" * 70)

    if not os.path.exists(MODEL_PATH):
        print(f"[ERROR] Model file not found at: {MODEL_PATH}")
        return

    print(f"Loading Model: {MODEL_PATH}")
    model = YOLO(MODEL_PATH)

    print(f"Model Task   : {model.task}")
    print(f"Model Classes: {model.names}")
    print("-" * 70)

    os.makedirs(RESULTS_DIR, exist_ok=True)

    val_images = sorted(glob.glob(os.path.join(VAL_IMAGES_DIR, "*.jpg")))
    if not val_images:
        # Fallback to test_onion.jpg if val dir not found
        val_images = ["test_onion.jpg"]

    # Limit to 10 validation images for comprehensive evaluation
    test_subset = val_images[:10]

    # Test multiple confidence thresholds
    thresholds = [0.10, 0.20, 0.30, 0.40, 0.50]
    print(f"\n[EVALUATING CONFIDENCE THRESHOLDS across {len(test_subset)} images]:")
    print(f"{'Threshold':<10} | {'Total Detections':<18} | {'Avg Detections/Image':<22} | {'Detection Rate %'}")
    print("-" * 70)
    for t in thresholds:
        t_total = 0
        imgs_with_det = 0
        for imp in test_subset:
            res = model.predict(imp, conf=t, verbose=False)
            cnt = len(res[0].boxes) if res and res[0].boxes is not None else 0
            t_total += cnt
            if cnt > 0:
                imgs_with_det += 1
        rate = (imgs_with_det / len(test_subset)) * 100
        avg = t_total / len(test_subset)
        print(f"{t:<10.2f} | {t_total:<18} | {avg:<22.2f} | {rate:<.1f}%")

    print("\n" + "=" * 70)
    # Selected balanced threshold for production
    PROD_CONF = 0.25
    print(f"RUNNING DETAILED EVALUATION AT PRODUCTION THRESHOLD (conf = {PROD_CONF}):")
    print("=" * 70)

    total_images = len(test_subset)
    images_with_det = 0
    total_detections = 0
    all_confs = []

    for idx, img_path in enumerate(test_subset):
        filename = os.path.basename(img_path)
        res = model.predict(img_path, conf=PROD_CONF, verbose=False)[0]
        boxes = res.boxes
        box_count = len(boxes) if boxes is not None else 0

        if box_count > 0:
            images_with_det += 1
            total_detections += box_count

        print(f"\n[{idx + 1}/{total_images}] Image: {filename} | Detections: {box_count}")

        if boxes is not None and box_count > 0:
            for b_idx, box in enumerate(boxes):
                cls_id = int(box.cls[0].item())
                cname = res.names.get(cls_id, f"class_{cls_id}")
                conf = float(box.conf[0].item())
                all_confs.append(conf)
                xyxy = [round(float(c), 1) for c in box.xyxy[0].tolist()]
                print(f"   Detection {b_idx + 1}: Class={cname:<10} | Conf={conf:.4f} ({conf * 100:.1f}%) | BBox={xyxy}")

        # Save annotated image
        try:
            rendered_bgr = res.plot()
            out_file = os.path.join(RESULTS_DIR, f"result_{filename}")
            cv2.imwrite(out_file, rendered_bgr)
        except Exception as e:
            print(f"   Warning saving plot: {e}")

    avg_conf = (sum(all_confs) / len(all_confs)) if all_confs else 0.0
    avg_det_per_img = (total_detections / total_images) if total_images > 0 else 0.0

    print("\n" + "=" * 70)
    print("EVALUATION SUMMARY:")
    print(f"  Total test images evaluated : {total_images}")
    print(f"  Images with detections      : {images_with_det}")
    print(f"  Images without detections   : {total_images - images_with_det}")
    print(f"  Average detections / image  : {avg_det_per_img:.2f}")
    print(f"  Average confidence          : {avg_conf:.4f} ({avg_conf * 100:.1f}%)")
    print(f"  Annotated results saved to  : {os.path.abspath(RESULTS_DIR)}")
    print("=" * 70)

if __name__ == "__main__":
    test_model()
