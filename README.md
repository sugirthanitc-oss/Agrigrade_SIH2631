# Onion Quality AI (OQ-AI)

An end-to-end AI-powered onion batch grading and defect detection platform designed for mobile assessment, real-time computer vision inference, configurable agricultural quality scoring, and digital audit reporting.

---

## 📁 Project Architecture & Structure

```text
onion-quality-ai/
├── mobile/                     # React Native + Expo Mobile Client
│   ├── assets/                 # Icons, splash screens, static visuals
│   ├── src/
│   │   ├── api/                # API client (Axios HTTP client for FastAPI endpoints)
│   │   ├── components/         # Reusable UI components (CameraView, MetricCard, QualityChart)
│   │   ├── screens/            # App screens (Capture, AssessmentResult, History, ReportViewer)
│   │   ├── navigation/         # React Navigation stacks & bottom tabs
│   │   ├── types/              # TypeScript definitions for assessment metrics & grading
│   │   └── utils/              # Calculation helpers, color badges, date formatters
│   ├── app.json                # Expo configuration
│   └── package.json            # Mobile dependencies (Expo, Navigation, Camera, Axios)
│
├── backend/                    # Python FastAPI Backend Service
│   ├── main.py                 # FastAPI application entrypoint & server lifespan
│   ├── requirements.txt        # Backend dependencies (FastAPI, Ultralytics, SQLAlchemy)
│   ├── .env                    # Environment configuration (model path, grading rules)
│   ├── models/                 # Pydantic schemas and configurable grading rules
│   │   ├── schemas.py          # Request & response models (counts, percentages, grades)
│   │   └── grading_rules.py    # Configurable agricultural grading thresholds
│   ├── services/               # Core business and AI inference logic
│   │   ├── yolo_service.py     # Ultralytics YOLO loader & class detector
│   │   ├── grading_service.py  # Percentage, Grade A, and URS calculation engine
│   │   └── storage_service.py  # File validation, integrity checks, and temporary uploads
│   ├── routes/                 # FastAPI router endpoints:
│   │   ├── analyze.py          # POST /analyze (Core YOLO detection & grading)
│   │   ├── health.py           # GET /health (Health & YOLO model status check)
│   │   └── history.py          # GET /history & GET /api/v1/dashboard/stats
│   ├── uploads/                # Local storage for raw & annotated detection images
│   └── database/               # SQLite database engine and ORM persistence
│       ├── connection.py       # Engine and session lifecycle
│       └── models.py           # AssessmentRecord table
│
├── ai/                         # Computer Vision & Grading Intelligence (Isolated Component)
│   ├── weights/                # Model weights directory (drop your trained `best.pt` here)
│   │   └── README.md           # Instructions for model loading
│   ├── inference/              # Ultralytics YOLO inference wrapper
│   │   ├── detector.py         # Model loader, detection pipeline, bounding box renderer
│   │   └── postprocess.py      # Count aggregation & distribution calculator
│   ├── grading/                # Configurable agricultural quality rules
│   │   ├── config.json         # Grading thresholds (Grade A, Grade B, URS criteria)
│   │   └── rules.py            # Rule evaluation engine
│   ├── scripts/                # Standalone verification utilities
│   │   ├── test_inference.py   # Test model locally on sample images without the backend
│   │   └── export_model.py     # Optional export (ONNX, TFLite, etc.)
│   └── requirements.txt        # AI-specific dependencies (Ultralytics, Torch, OpenCV/Pillow)
│
├── dataset/                    # Training and Validation Datasets
│   ├── data.yaml               # Ultralytics YOLO dataset configuration file
│   ├── images/
│   │   ├── train/              # Training images
│   │   └── val/                # Validation images
│   └── labels/
│       ├── train/              # YOLO-format annotation text files (.txt)
│       └── val/                # YOLO-format validation annotations (.txt)
│
└── README.md                   # Complete architectural guide and setup instructions
```

---

## 🔍 Detailed Component Breakdown

### 1. `ai/` — Isolated AI / Computer Vision Engine
- **Decoupled Architecture**: The AI component is completely decoupled from web/API logic. It can be run standalone as a Python CLI script or imported as a package.
- **Model Drop-in (`ai/weights/best.pt`)**: Simply place your trained Ultralytics YOLO model weight file into `ai/weights/best.pt`.
- **Target Classes (5)**:
  - `0: healthy`: Well-formed, intact outer skin, no cuts, rot, or sprouts.
  - `1: damaged`: Cuts, bruises, skin breaks, mechanical injury.
  - `2: rotten`: Black mold, fungal rot, watery scales, decay.
  - `3: sprouted`: Green shoot emergence (degrades storage life and commercial value).
  - `4: undersized`: Below standard marketable diameter/size.
- **Grading Engine (`ai/grading/`)**:
  - Computes counts, percentages, and evaluates configurable grading rules.
  - **Grade A**: Batches with high healthy percentage (e.g. $\ge 80\%$) and defect tolerances within strict limits.
  - **URS (Under Regular Standard / Reject Stock)**: Batches failing minimum quality or exceeding critical rot thresholds (e.g., rotten $> 5\%$ or total defect $> 35\%$).

### 2. `backend/` — FastAPI Service & Data Store
- **FastAPI Core (`backend/app/main.py`)**: Asynchronous, high-throughput REST API with automatic OpenAPI Swagger docs (`/docs`).
- **SQLite Database (`backend/app/db/`)**: Stores assessment records, individual onion counts, percentages, assigned grade, timestamps, and image references.
- **Image Pipeline**: Accepts multipart file uploads from mobile, pipes images to `ai/inference/detector.py`, saves bounding box annotated images, and returns structured JSON.
- **Digital Quality Report (`backend/app/services/report_service.py`)**: Generates comprehensive PDF quality certificates including batch summary, category breakdown charts, grading verdict, and annotated inspection images.

### 3. `mobile/` — React Native + Expo App
- **Image Acquisition**: Camera capture or gallery upload using `expo-camera` / `expo-image-picker`.
- **Batch Inspection Screen**: Displays the annotated onion image with colored bounding boxes for each class.
- **Metrics & Analytics**:
  - Total onion count.
  - Category breakdown: Healthy, Damaged, Rotten, Sprouted, Undersized.
  - Percentage distribution with intuitive color-coded progress bars.
  - Grade verdict badge (**Grade A** / **Grade B** / **URS**).
- **History & Audits**: View previous assessments stored in SQLite via backend API.
- **Digital Report Export**: Direct preview and sharing of generated PDF inspection reports.

### 4. `dataset/` — YOLO Dataset Directory
- Ready for YOLOv8/YOLOv11 training pipelines.
- Standard Ultralytics format with `data.yaml` defining classes and paths.
