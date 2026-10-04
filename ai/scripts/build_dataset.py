import os
import glob
import shutil
import random
import cv2
import numpy as np
from PIL import Image
from ultralytics import YOLO

# Target 5 classes
CLASSES = {
    0: "healthy",
    1: "damaged",
    2: "rotten",
    3: "sprouted",
    4: "undersized"
}

ROBOFLOW_DIR = "C:/Users/sugirthan/Downloads/Final onion Classification.v1i.folder"
RED_WHITE_DIR = "C:/Users/sugirthan/Downloads/Red and White Onion Dataset/New Onion/Bulb"
TARGET_DIR = os.path.abspath("dataset")

def ensure_dirs():
    for split in ["train", "val"]:
        os.makedirs(os.path.join(TARGET_DIR, "images", split), exist_ok=True)
        os.makedirs(os.path.join(TARGET_DIR, "labels", split), exist_ok=True)
    os.makedirs(os.path.join(TARGET_DIR, "debug"), exist_ok=True)

def get_bounding_boxes(detector, img_path, img_w, img_h):
    """
    Combines YOLO pretrained object proposals and OpenCV contour detection
    to accurately isolate onion bounding boxes.
    """
    boxes = []
    
    # 1. Try YOLO detector proposals (detects round objects / fruits / onions)
    try:
        res = detector.predict(img_path, conf=0.15, iou=0.4, verbose=False)
        if res and len(res[0].boxes) > 0:
            for b in res[0].boxes:
                xyxy = b.xyxy[0].tolist()
                bw = xyxy[2] - xyxy[0]
                bh = xyxy[3] - xyxy[1]
                # Filter out tiny artifacts or full-image false positives
                if bw >= img_w * 0.08 and bh >= img_h * 0.08:
                    x_c = (xyxy[0] + xyxy[2]) / 2.0 / img_w
                    y_c = (xyxy[1] + xyxy[3]) / 2.0 / img_h
                    norm_w = bw / img_w
                    norm_h = bh / img_h
                    # Clamp to [0, 1]
                    boxes.append((
                        max(0.01, min(0.99, x_c)),
                        max(0.01, min(0.99, y_c)),
                        max(0.02, min(0.98, norm_w)),
                        max(0.02, min(0.98, norm_h))
                    ))
    except Exception as e:
        pass

    # 2. If no detector boxes found, fallback to adaptive threshold / contour
    if not boxes:
        try:
            img = cv2.imread(img_path)
            if img is not None:
                gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
                blurred = cv2.GaussianBlur(gray, (7, 7), 0)
                thresh = cv2.adaptiveThreshold(
                    blurred, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY_INV, 21, 4
                )
                contours, _ = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
                for c in contours:
                    x, y, bw, bh = cv2.boundingRect(c)
                    if bw > img_w * 0.2 and bh > img_h * 0.2:
                        x_c = (x + bw / 2.0) / img_w
                        y_c = (y + bh / 2.0) / img_h
                        norm_w = bw / img_w
                        norm_h = bh / img_h
                        boxes.append((
                            max(0.01, min(0.99, x_c)),
                            max(0.01, min(0.99, y_c)),
                            max(0.02, min(0.98, norm_w)),
                            max(0.02, min(0.98, norm_h))
                        ))
        except Exception:
            pass

    # 3. If still empty, use sensible centered bounding box (typical single onion capture)
    if not boxes:
        boxes.append((0.5, 0.5, 0.75, 0.75))

    return boxes

def build_dataset():
    random.seed(42)
    ensure_dirs()
    detector = YOLO("ai/yolo11n.pt")

    collected_data = []

    # 1. Healthy from Roboflow + Red and White dataset
    print("[1/5] Collecting Healthy samples...")
    rf_healthy = glob.glob(f"{ROBOFLOW_DIR}/**/healthy/*.jpg", recursive=True)
    rw_healthy_single = glob.glob(f"{RED_WHITE_DIR}/Healthy/**/Single/*.jpg", recursive=True)
    rw_healthy_multi = glob.glob(f"{RED_WHITE_DIR}/Healthy/**/Multiple/*.jpg", recursive=True)
    rw_healthy_mixed = glob.glob(f"{RED_WHITE_DIR}/Healthy/Mixed/**/*.jpg", recursive=True)

    for p in rf_healthy[:35] + rw_healthy_single[:20] + rw_healthy_multi[:15] + rw_healthy_mixed[:10]:
        collected_data.append((p, 0))

    # 2. Damaged from Roboflow rotten_damaged & Unhealthy
    print("[2/5] Collecting Damaged samples...")
    rf_damaged = [p for p in glob.glob(f"{ROBOFLOW_DIR}/**/rotten_damaged/*.jpg", recursive=True) if "fresh" in p.lower() or "slice" in p.lower() or "damaged" in p.lower()]
    rw_unhealthy = glob.glob(f"{RED_WHITE_DIR}/Unhealthy/**/Single/*.jpg", recursive=True)
    for p in rf_damaged[:30] + rw_unhealthy[:35]:
        collected_data.append((p, 1))

    # 3. Rotten from Roboflow rotten_damaged & Unhealthy Multiple
    print("[3/5] Collecting Rotten samples...")
    rf_rotten = [p for p in glob.glob(f"{ROBOFLOW_DIR}/**/rotten_damaged/*.jpg", recursive=True) if p not in rf_damaged]
    rw_unhealthy_multi = glob.glob(f"{RED_WHITE_DIR}/Unhealthy/**/Multiple/*.jpg", recursive=True)
    for p in rf_rotten[:35] + rw_unhealthy_multi[:25]:
        collected_data.append((p, 2))

    # 4. Sprouted from Roboflow sprouted
    print("[4/5] Collecting Sprouted samples...")
    rf_sprouted = glob.glob(f"{ROBOFLOW_DIR}/**/sprouted/*.jpg", recursive=True)
    for p in rf_sprouted:
        collected_data.append((p, 3))

    # 5. Undersized from smaller / scaled onions in Red & White
    print("[5/5] Collecting Undersized samples...")
    rw_white_single = glob.glob(f"{RED_WHITE_DIR}/Healthy/White Onion/Single/*.jpg", recursive=True)
    for p in rw_white_single[100:140]:
        collected_data.append((p, 4))

    print(f"Total raw items gathered: {len(collected_data)}")
    random.shuffle(collected_data)

    # 80/20 train/val split
    split_idx = int(len(collected_data) * 0.8)
    train_items = collected_data[:split_idx]
    val_items = collected_data[split_idx:]

    def process_split(items, split_name):
        saved_count = 0
        for idx, (img_path, class_id) in enumerate(items):
            try:
                with Image.open(img_path) as im:
                    im_w, im_h = im.size
                    im_rgb = im.convert("RGB")

                # If undersized class, scale down onion bulb inside canvas to reflect small diameter
                if class_id == 4:
                    new_w, new_h = int(im_w * 0.55), int(im_h * 0.55)
                    scaled = im_rgb.resize((new_w, new_h), Image.Resampling.LANCZOS)
                    canvas = Image.new("RGB", (im_w, im_h), (240, 240, 240))
                    offset = ((im_w - new_w) // 2, (im_h - new_h) // 2)
                    canvas.paste(scaled, offset)
                    im_rgb = canvas

                dest_filename = f"onion_{split_name}_{idx:04d}.jpg"
                dest_img_path = os.path.join(TARGET_DIR, "images", split_name, dest_filename)
                im_rgb.save(dest_img_path, "JPEG", quality=95)

                # Generate bounding boxes
                boxes = get_bounding_boxes(detector, dest_img_path, im_w, im_h)

                # Write YOLO format label file: class_id x_center y_center width height
                dest_label_path = os.path.join(TARGET_DIR, "labels", split_name, f"onion_{split_name}_{idx:04d}.txt")
                with open(dest_label_path, "w") as f:
                    for (xc, yc, w, h) in boxes:
                        f.write(f"{class_id} {xc:.6f} {yc:.6f} {w:.6f} {h:.6f}\n")

                saved_count += 1
            except Exception as e:
                print(f"Error processing {img_path}: {e}")

        print(f"[{split_name.upper()}] Processed & saved {saved_count} images and labels.")

    process_split(train_items, "train")
    process_split(val_items, "val")

    # Write data.yaml
    yaml_content = f"""# YOLO Object Detection Dataset for Onion Quality Assessment
path: {TARGET_DIR.replace('\\', '/')}
train: images/train
val: images/val

names:
  0: healthy
  1: damaged
  2: rotten
  3: sprouted
  4: undersized
"""
    with open(os.path.join(TARGET_DIR, "data.yaml"), "w") as f:
        f.write(yaml_content)

    print("Dataset generation complete!")

if __name__ == "__main__":
    build_dataset()
