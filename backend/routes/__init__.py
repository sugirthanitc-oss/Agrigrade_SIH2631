from .analyze import router as analyze_router
from .health import router as health_router
from .history import router as history_router

__all__ = ["analyze_router", "health_router", "history_router"]
