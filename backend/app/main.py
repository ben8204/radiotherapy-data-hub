# Entry point for the FastAPI
import os
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware

from app.database import engine, Base
from app.models import (
    article,
    experience,
    donnee,
    detector,
    machine,
    phantom,
    column_mapping,
)
from app.routes import (
    articles,
    experiences,
    files,
    donnees,
    detectors,
    experience_detectors,
    machines,
    experience_machines,
    phantoms,
    experience_phantoms,
    complete_submission,
)


app = FastAPI(title="Dosimetry Database API")

# CORS configuration from environment variable
CORS_ORIGINS = os.getenv(
    "CORS_ORIGINS", "http://localhost:3000,http://localhost:5173,http://localhost:8080")
ALLOWED_ORIGINS = [origin.strip() for origin in CORS_ORIGINS.split(",")]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# Creating database tables at startup
print("Creating database tables...")
Base.metadata.create_all(bind=engine)
print("Database tables created successfully")

# Creating routers
app.include_router(articles.router)
app.include_router(experiences.router)
app.include_router(files.router)
app.include_router(donnees.router)


@app.get("/")
def root():
    return {"status": "API running", "message": "Radiotherapy Data Hub API"}


@app.get("/health")
def health_check():
    """Health check endpoint for monitoring"""
    return {"status": "healthy", "service": "radiotherapy-api"}


app.include_router(machines.router)
app.include_router(phantoms.router)
app.include_router(detectors.router)
app.include_router(experience_machines.router)
app.include_router(experience_phantoms.router)
app.include_router(experience_detectors.router)
app.include_router(complete_submission.router)

# Mount frontend static after API routers so API endpoints are not shadowed
# In development, the frontend runs on a separate dev server (npm run dev)
# Uncomment the line below only when the frontend has been built (npm run build)
# app.mount("/", StaticFiles(directory="../frontend/dist", html=True), name="static")
