# AI Weights Directory

Place your trained Ultralytics YOLO model weight file here:

```text
ai/weights/best.pt
```

## Model Requirements
- **Framework**: Ultralytics YOLO (YOLOv8 / YOLOv9 / YOLOv10 / YOLOv11)
- **Task**: Object Detection (`detect`)
- **Classes (5)**:
  - `0`: `healthy`
  - `1`: `damaged`
  - `2`: `rotten`
  - `3`: `sprouted`
  - `4`: `undersized`

The backend and AI inference engine automatically look for `ai/weights/best.pt`.
You can configure a custom weights path via the `YOLO_MODEL_PATH` environment variable in `backend/.env`.
