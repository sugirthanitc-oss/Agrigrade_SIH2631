import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# Database path resolution
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_FILE_PATH = os.path.join(BASE_DIR, "onion_quality.db")
DATABASE_URL = os.getenv("DATABASE_URL", f"sqlite:///{DB_FILE_PATH}")

# For SQLite, check_same_thread must be False for multithreaded FastAPI requests
engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {},
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    """FastAPI dependency that yields a scoped database session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    """Initializes database tables on application startup."""
    # Ensure database directory exists
    os.makedirs(os.path.dirname(DB_FILE_PATH), exist_ok=True)
    Base.metadata.create_all(bind=engine)
