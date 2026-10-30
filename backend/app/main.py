"""Main entrypoint for MandiMitra AI FastAPI Backend."""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .api.endpoints import router as api_router
from .database.connection import engine, Base
from .models import db_models

# Automatically generate database tables
try:
    Base.metadata.create_all(bind=engine)
except Exception as e:
    print(f"Database init warning: {e}")

app = FastAPI(
    title="MandiMitra AI API",
    description="Agricultural Market Intelligence and Decision-Support Platform - 'Don't just sell your harvest. Sell it smarter.'",
    version="1.0.0"
)

# Enable CORS for Vite frontend and deployment
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API Router
app.include_router(api_router)

@app.get("/")
def read_root():
    return {
        "name": "MandiMitra AI",
        "tagline": "Don't just sell your harvest. Sell it smarter.",
        "status": "active",
        "docs_url": "/docs"
    }

@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "service": "MandiMitra AI Backend",
        "version": "1.0.0"
    }
