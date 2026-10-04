# AI Models Directory

Place your trained Ultralytics YOLO model weight file here:

```text
ai/models/best.pt
```

## Classes
The model must detect and classify bounding boxes into:
- `0`: `healthy`
- `1`: `damaged`
- `2`: `rotten`
- `3`: `sprouted`
- `4`: `undersized`

The backend `POST /analyze` endpoint directly loads from this path (`../ai/models/best.pt`).
