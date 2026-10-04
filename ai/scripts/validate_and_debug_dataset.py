import os
import glob
import cv2
import yaml

TARGET_DIR = os.path.abspath("dataset")
DEBUG_DIR = os.path.join(TARGET_DIR, "debug")
DATA_YAML = os.path.join(TARGET_DIR, "data.yaml")

CLASS_COLORS = {
    0: (0, 255, 0),     # healthy (green)
    1: (0, 165, 255),   # damaged (orange)
    2: (0, 0, 255),     # rotten (red)
    3: (255, 255, 0),   # sprouted (cyan/yellow)
    4: (255, 0, 255)    # undersized (magenta)
}

def validate_and_debug():
    print("=" * 60)
    print(" DATASET VALIDATION & GROUND TRUTH VISUALIZATION")
    print("=" * 60)

    # 1. Check data.yaml
    if not os.path.exists(DATA_YAML):
        print(f"[ERROR] data.yaml not found at {DATA_YAML}")
        return False
    with open(DATA_YAML, "r") as f:
        data_cfg = yaml.safe_load(f)
    print(f"data.yaml loaded successfully. Classes ({len(data_cfg['names'])}):")
    for cid, cname in data_cfg["names"].items():
        print(f"  Class {cid}: {cname}")

    os.makedirs(DEBUG_DIR, exist_ok=True)
    total_issues = 0
    class_counts = {cid: 0 for cid in data_cfg["names"]}

    for split in ["train", "val"]:
        img_dir = os.path.join(TARGET_DIR, "images", split)
        lbl_dir = os.path.join(TARGET_DIR, "labels", split)

        img_files = sorted(glob.glob(os.path.join(img_dir, "*.jpg")))
        lbl_files = sorted(glob.glob(os.path.join(lbl_dir, "*.txt")))

        print(f"\nChecking split: '{split.upper()}' | Images: {len(img_files)} | Labels: {len(lbl_files)}")

        if len(img_files) != len(lbl_files):
            print(f"[WARNING] Image count ({len(img_files)}) != Label count ({len(lbl_files)})")
            total_issues += 1

        for idx, img_path in enumerate(img_files):
            base_name = os.path.splitext(os.path.basename(img_path))[0]
            lbl_path = os.path.join(lbl_dir, f"{base_name}.txt")

            if not os.path.exists(lbl_path):
                print(f"[ERROR] Missing label file for image: {img_path}")
                total_issues += 1
                continue

            # Read image
            img = cv2.imread(img_path)
            if img is None:
                print(f"[ERROR] Corrupted image: {img_path}")
                total_issues += 1
                continue
            h, w = img.shape[:2]

            # Read label lines
            with open(lbl_path, "r") as f:
                lines = [l.strip() for l in f.readlines() if l.strip()]

            if not lines:
                print(f"[WARNING] Empty label file: {lbl_path}")
                total_issues += 1
                continue

            annotated = img.copy()
            for line_idx, line in enumerate(lines):
                parts = line.split()
                if len(parts) != 5:
                    print(f"[ERROR] Invalid format line {line_idx} in {lbl_path}: '{line}'")
                    total_issues += 1
                    continue

                try:
                    cid = int(parts[0])
                    xc, yc, bw, bh = map(float, parts[1:])
                except ValueError:
                    print(f"[ERROR] Non-numeric box line {line_idx} in {lbl_path}")
                    total_issues += 1
                    continue

                if cid not in data_cfg["names"]:
                    print(f"[ERROR] Class ID {cid} out of range [0, 4] in {lbl_path}")
                    total_issues += 1
                    continue

                class_counts[cid] += 1

                # Check normalization boundaries
                if not (0.0 <= xc <= 1.0 and 0.0 <= yc <= 1.0 and 0.0 < bw <= 1.0 and 0.0 < bh <= 1.0):
                    print(f"[WARNING] Out of bounds box in {lbl_path}: {xc}, {yc}, {bw}, {bh}")
                    total_issues += 1

                # Convert to pixel coordinates
                x1 = int((xc - bw / 2.0) * w)
                y1 = int((yc - bh / 2.0) * h)
                x2 = int((xc + bw / 2.0) * w)
                y2 = int((yc + bh / 2.0) * h)

                # Clamp
                x1, y1 = max(0, x1), max(0, y1)
                x2, y2 = min(w - 1, x2), min(h - 1, y2)

                color = CLASS_COLORS.get(cid, (255, 255, 255))
                cname = data_cfg["names"].get(cid, str(cid))

                # Draw bounding box & label
                cv2.rectangle(annotated, (x1, y1), (x2, y2), color, 2)
                label_text = f"{cname} (class {cid})"
                cv2.putText(annotated, label_text, (x1, max(20, y1 - 8)),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.5, color, 2)

            # Save first 5 debug images per split to dataset/debug/
            if idx < 5:
                debug_out = os.path.join(DEBUG_DIR, f"gt_{split}_{base_name}.jpg")
                cv2.imwrite(debug_out, annotated)

    print("\n" + "=" * 60)
    print("DATASET CLASS DISTRIBUTION (Total Object Instances):")
    for cid, cname in data_cfg["names"].items():
        print(f"  Class {cid} ({cname:<10}): {class_counts[cid]} instances")
    print(f"\nTotal Validation Issues Found: {total_issues}")
    print(f"Ground truth visual samples saved to: {DEBUG_DIR}")
    print("=" * 60)
    return total_issues == 0

if __name__ == "__main__":
    validate_and_debug()
