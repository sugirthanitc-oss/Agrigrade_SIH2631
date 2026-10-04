import os
import shutil
from ultralytics import YOLO

def train():
    print("=" * 60)
    print(" ONION QUALITY AI - YOLO OBJECT DETECTION MODEL TRAINING")
    print("=" * 60)

    # Use pretrained YOLO nano weights for fast transfer learning & high accuracy
    pretrained = "ai/yolo11n.pt"
    if not os.path.exists(pretrained):
        pretrained = "yolo11n.pt"

    print(f"Loading base model: {pretrained}")
    model = YOLO(pretrained)

    data_yaml = os.path.abspath("dataset/data.yaml")
    print(f"Dataset config: {data_yaml}")

    # Training configuration tuned for hackathon:
    # - imgsz=512 for fast CPU iterations while maintaining small onion feature details
    # - epochs=15
    # - batch=8
    # - mosaic, fliplr, scale augmentations for robust variations
    results = model.train(
        data=data_yaml,
        epochs=15,
        imgsz=512,
        batch=8,
        workers=0,  # avoid multiprocessing deadlocks on Windows
        project="runs/detect",
        name="onion_detector_v1",
        patience=5,
        save=True,
        plots=True,
        verbose=True,
        device="cpu"
    )

    trained_best = os.path.join("runs", "detect", "onion_detector_v1", "weights", "best.pt")
    if os.path.exists(trained_best):
        print(f"\nTraining completed! Trained weights found at: {trained_best}")
        
        # Copy to ai/models/best.pt and ai/weights/best.pt
        os.makedirs("ai/models", exist_ok=True)
        os.makedirs("ai/weights", exist_ok=True)
        shutil.copy2(trained_best, "ai/models/best.pt")
        shutil.copy2(trained_best, "ai/weights/best.pt")
        print("Updated target model at: ai/models/best.pt and ai/weights/best.pt")
    else:
        print("[WARNING] Could not locate output best.pt weights.")

if __name__ == "__main__":
    train()
