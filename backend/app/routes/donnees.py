import os
import shutil
import json
from fastapi import APIRouter, UploadFile, File, Form, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy.exc import DatabaseError

from app.database import SessionLocal
from app.models.donnee import Donnee
from app.models.column_mapping import ColumnMapping
from app.models.experience import Experience
from app.schemas.donnee import DonneeCreate, ColumnMappingBase

router = APIRouter(prefix="/donnees", tags=["Donnees"])

UPLOAD_DIR = "data/uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.post("/upload/{experience_id}", status_code=status.HTTP_201_CREATED)
def upload_donnee(
    experience_id: int,
    file: UploadFile = File(...),
    data_type: str = Form(...),
    unit: str = Form(None),
    description: str = Form(None),
    columnMapping: str = Form(None),  # JSON string of column mappings
    db: Session = Depends(get_db),
):
    # Vérifier que l'expérience existe
    experience = db.query(Experience).filter(
        Experience.experience_id == experience_id).first()
    if not experience:
        raise HTTPException(status_code=404, detail="Experience not found")

    donnee_data = DonneeCreate(
        data_type=data_type,
        unit=unit,
        file_format=file.filename.split(".")[-1],
        description=description,
    )

    # Saving the file
    file_path = f"{UPLOAD_DIR}/{experience_id}_{file.filename}"
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # Database insertion
    donnee = Donnee(
        experience_id=experience_id,
        data_type=donnee_data.data_type,
        unit=donnee_data.unit,
        file_format=donnee_data.file_format,
        file_path=file_path,
        description=donnee_data.description,
    )

    db.add(donnee)
    try:
        db.flush()  # Flush to get the donnee.data_id before creating column mappings
    except DatabaseError as e:
        db.rollback()
        print(f"Database Error during donnee creation: {str(e)}")
        raise HTTPException(
            status_code=409,
            detail=f"Database Error: {str(e)}"
        )
    except Exception as e:
        db.rollback()
        print(f"Error during donnee creation: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Error: {str(e)}"
        )

    # Create column mappings if provided
    if columnMapping:
        try:
            mappings = json.loads(columnMapping)
            if isinstance(mappings, list):
                for mapping in mappings:
                    # Support both camelCase (from frontend) and snake_case
                    column_name = mapping.get(
                        "column_name") or mapping.get("name")
                    data_type = mapping.get(
                        "data_type") or mapping.get("dataType")
                    column_description = mapping.get(
                        "column_description") or mapping.get("description")
                    unit = mapping.get("unit")

                    # Only create if we have at least column_name and data_type
                    if column_name and data_type:
                        column_map = ColumnMapping(
                            data_id=donnee.data_id,
                            column_name=column_name,
                            column_description=column_description,
                            data_type=data_type,
                            unit=unit,
                        )
                        db.add(column_map)
        except (json.JSONDecodeError, KeyError) as e:
            db.rollback()
            print(f"Invalid columnMapping format: {str(e)}")
            raise HTTPException(
                status_code=400,
                detail=f"Invalid columnMapping format: {str(e)}"
            )

    try:
        db.commit()
        print("Donnee and column mappings committed successfully")
    except DatabaseError as e:
        db.rollback()
        print(f"Database Error during commit: {str(e)}")
        raise HTTPException(
            status_code=409,
            detail=f"Database Error: {str(e)}"
        )
    except Exception as e:
        db.rollback()
        print(f"Error during commit: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Error: {str(e)}"
        )

    db.refresh(donnee)
    return donnee


@router.get("/")
def list_donnees(db: Session = Depends(get_db)):
    return db.query(Donnee).all()
