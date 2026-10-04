from ultralytics import YOLO

def main():
    # Load a YOLO classification model (YOLOv8n-cls)
    model = YOLO('yolov8n-cls.pt')

    # Train the model using the Roboflow classification dataset
    dataset_path = 'C:/Users/sugirthan/Downloads/Final onion Classification.v1i.folder'
    print(f"Starting training on dataset: {dataset_path}")

    results = model.train(
        data=dataset_path,
        epochs=10,
        imgsz=224,
        project='runs/classify',
        name='onion_cls_v1'
    )
    print("Training complete! Model saved to runs/classify/onion_cls_v1/weights/best.pt")

if __name__ == '__main__':
    main()
