"""Database engine and session management for MandiMitra AI."""
import os
from pathlib import Path
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from dotenv import load_dotenv

load_dotenv()

BACKEND_ROOT = Path(__file__).resolve().parents[2]
DEFAULT_DB_PATH = BACKEND_ROOT / "mandimitra.db"

# Default to SQLite locally, override with PostgreSQL in production
DATABASE_URL = os.getenv("DATABASE_URL", f"sqlite:///{DEFAULT_DB_PATH.as_posix()}")

# Render / Heroku postgres:// -> postgresql:// fix
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}

engine = create_engine(DATABASE_URL, connect_args=connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def auto_migrate():
    """Automatically adds missing columns to existing SQLite tables if they exist."""
    if not DATABASE_URL.startswith("sqlite"):
        return
    import sqlite3
    db_file = DEFAULT_DB_PATH
    if not db_file.exists():
        return
    conn = sqlite3.connect(db_file)
    cursor = conn.cursor()
    try:
        # Check tomato_batches
        cursor.execute("PRAGMA table_info(tomato_batches)")
        batch_cols = {row[1] for row in cursor.fetchall()}
        if batch_cols:
            if "storage_bay" not in batch_cols:
                cursor.execute("ALTER TABLE tomato_batches ADD COLUMN storage_bay VARCHAR DEFAULT 'Bay 1'")

        # Check storage_alerts
        cursor.execute("PRAGMA table_info(storage_alerts)")
        alert_cols = {row[1] for row in cursor.fetchall()}
        if alert_cols:
            if "occurrence_count" not in alert_cols:
                cursor.execute("ALTER TABLE storage_alerts ADD COLUMN occurrence_count INTEGER DEFAULT 1")

        # Check batch_sales
        cursor.execute("PRAGMA table_info(batch_sales)")
        sale_cols = {row[1] for row in cursor.fetchall()}
        if sale_cols:
            if "destination_mandi" not in sale_cols:
                cursor.execute("ALTER TABLE batch_sales ADD COLUMN destination_mandi VARCHAR")
            if "total_amount" not in sale_cols:
                cursor.execute("ALTER TABLE batch_sales ADD COLUMN total_amount FLOAT")

        conn.commit()
    except Exception as e:
        print(f"[DB Auto-Migrate Warning] {e}")
    finally:
        conn.close()

# Run migration on load
auto_migrate()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
