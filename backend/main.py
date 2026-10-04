import os
from contextlib import asynccontextmanager
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

# Load environment configuration
load_dotenv()

from database.connection import init_db
from services.storage_service import UPLOAD_DIR
from services.yolo_service import yolo_engine
from routes.analyze import router as analyze_router
from routes.health import router as health_router
from routes.history import router as history_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Initialize SQLite tables and inspect YOLO weights
    init_db()
    print(f"[Startup] SQLite database initialized.")
    print(f"[Startup] YOLO Model target path: {yolo_engine.get_model_path()}")
    if yolo_engine.is_loaded():
        print(f"[Startup] YOLO Model successfully loaded.")
    else:
        print(f"[Startup] Note: YOLO model weights not found at {yolo_engine.get_model_path()}. Drop best.pt into ai/models/ to activate inference.")
    yield
    # Shutdown logic
    print("[Shutdown] Onion Quality AI backend shutting down.")


app = FastAPI(
    title="Onion Quality AI - Computer Vision API",
    description="FastAPI service for real-time onion batch assessment, YOLO defect detection, and agricultural grading.",
    version="1.0.0",
    lifespan=lifespan,
)

# Enable CORS for React Native & Web clients
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static file directory for serving original and annotated images
os.makedirs(UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

# Include Endpoints
app.include_router(health_router, tags=["Health"])
app.include_router(analyze_router, tags=["Analysis"])
app.include_router(history_router, tags=["History & Grading"])


@app.get("/")
def root():
    return {
        "service": "Onion Quality AI Backend",
        "version": "1.0.0",
        "endpoints": {
            "health": "GET /health",
            "analyze": "POST /analyze",
            "history": "GET /history",
            "dashboard_stats": "GET /api/v1/dashboard/stats",
            "docs": "GET /docs"
        },
        "yolo_model_loaded": yolo_engine.is_loaded()
    }


if __name__ == "__main__":
    import uvicorn

    host = os.getenv("HOST", "0.0.0.0")
    port = int(os.getenv("PORT", "8000"))
    uvicorn.run("main:app", host=host, port=port, reload=True)
