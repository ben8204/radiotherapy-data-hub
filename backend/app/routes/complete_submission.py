"""
Endpoint pour créer une soumission complète (article, expérience, données) en une seule transaction.
Cela garantit que soit tout est créé, soit rien n'est créé (atomicité).
"""
import json
import shutil
import os
from typing import List # Ajout crucial pour supporter plusieurs fichiers
from fastapi import APIRouter, UploadFile, File, Form, HTTPException, status, Depends
from sqlalchemy.orm import Session
from sqlalchemy.exc import DatabaseError, IntegrityError

from app.database import SessionLocal
from app.models.article import Article
from app.models.experience import Experience
from app.models.donnee import Donnee
from app.models.experience_machine import ExperienceMachine
from app.models.experience_detector import ExperienceDetector
from app.models.experience_phantom import ExperiencePhantom
from app.models.column_mapping import ColumnMapping
from app.services.entity_management import (
    get_or_create_machine,
    get_or_create_detector,
    get_or_create_phantom,
)

router = APIRouter(prefix="/complete", tags=["Complete Submission"])

UPLOAD_DIR = "data/uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.post("/submit", status_code=status.HTTP_201_CREATED)
def submit_complete_experiment(
    # Article fields
    title: str = Form(...),
    authors: str = Form(...),
    doi: str = Form(None),

    # Experience fields
    experience_description: str = Form(...),

    # Machines, Detectors, Phantoms (JSON arrays)
    machines: str = Form(...),
    detectors: str = Form(...),
    phantoms: str = Form(...),

    # --- NOUVEAU : MULTI-FICHIERS ---
    data_metadata: str = Form(...), # Contient un tableau JSON avec les types, descriptions et colonnes pour chaque fichier
    files: List[UploadFile] = File(default=[]), # Liste des fichiers physiques

    db: Session = Depends(get_db),
):
    """
    Crée un article, une expérience, lie les équipements,
    et upload PLUSIEURS fichiers de données, tout dans une seule transaction.
    """
    uploaded_file_paths = [] # Pour garder une trace et supprimer en cas d'erreur
    try:
        print("Starting complete submission...")

        # Step 1: Create Article
        print("Step 1: Creating article...")
        article = Article(titre=title, auteurs=authors, doi=doi if doi else None)
        db.add(article)
        db.flush()

        # Step 2: Create Experience
        print("Step 2: Creating experience...")
        experience = Experience(article_id=article.article_id, description=experience_description)
        db.add(experience)
        db.flush()

        # Step 3: Machines
        machines_data = json.loads(machines)
        linked_machines = []
        for machine_info in machines_data:
            machine = get_or_create_machine(
                db,
                constructeur=machine_info.get("manufacturer"),
                modele=machine_info.get("model"),
                type_machine=machine_info.get("machineType"),
            )
            linked_machines.append(machine)
            link = ExperienceMachine(
                experience_id=experience.experience_id,
                machine_id=machine.machine_id,
                energy=machine_info.get("energy"),
                collimation=machine_info.get("collimation"),
                settings=machine_info.get("settings"),
            )
            db.add(link)
        db.flush()

        # Step 4: Detectors
        detectors_data = json.loads(detectors)
        linked_detectors = []
        for detector_info in detectors_data:
            detector = get_or_create_detector(
                db,
                type_detecteur=detector_info.get("detectorType"),
                modele=detector_info.get("model"),
                constructeur=detector_info.get("manufacturer"),
            )
            linked_detectors.append(detector)
            link = ExperienceDetector(
                experience_id=experience.experience_id,
                detector_id=detector.detecteur_id,
                position=detector_info.get("position"),
                depth=detector_info.get("depth"),
                orientation=detector_info.get("orientation"),
            )
            db.add(link)
        db.flush()

        # Step 5: Phantoms
        phantoms_data = json.loads(phantoms)
        linked_phantoms = []
        for phantom_info in phantoms_data:
            phantom = get_or_create_phantom(
                db,
                manufacturer=phantom_info.get("manufacturer"),
                model=phantom_info.get("model"),
                phantom_type=phantom_info.get("phantom_type"),
                dimensions=phantom_info.get("dimensions"),
                material=phantom_info.get("material"),
            )
            linked_phantoms.append(phantom)
            link = ExperiencePhantom(
                experience_id=experience.experience_id,
                phantom_id=phantom.phantom_id,
                position=phantom_info.get("position"),
                orientation=phantom_info.get("orientation"),
            )
            db.add(link)
        db.flush()

        # Step 6 & 7: Upload files and create column mappings
        print(f"Step 6 & 7: Uploading {len(files)} data files...")
        metadata_list = json.loads(data_metadata)
        
        data_ids = []

        for i, meta in enumerate(metadata_list):
            if i >= len(files):
                break # Sécurité

            current_file = files[i]
            file_path = f"{UPLOAD_DIR}/{experience.experience_id}_{current_file.filename}"
            
            with open(file_path, "wb") as buffer:
                shutil.copyfileobj(current_file.file, buffer)
            uploaded_file_paths.append(file_path)

            donnee = Donnee(
                experience_id=experience.experience_id,
                data_type=meta.get("dataType", "other"),
                file_format=current_file.filename.split(".")[-1],
                file_path=file_path,
                description=meta.get("description", ""),
            )
            db.add(donnee)
            db.flush()
            data_ids.append(donnee.data_id)

            # Mappings pour ce fichier spécifique
            mappings = meta.get("columnMapping", [])
            for mapping in mappings:
                column_name = mapping.get("column_name") or mapping.get("name")
                data_type_col = mapping.get("data_type") or mapping.get("dataType")
                
                if column_name and data_type_col:
                    column_map = ColumnMapping(
                        data_id=donnee.data_id,
                        column_name=column_name,
                        column_description=mapping.get("column_description") or mapping.get("description"),
                        data_type=data_type_col,
                        unit=mapping.get("unit"),
                    )
                    db.add(column_map)

        # Commit everything
        print("Committing all changes to database...")
        db.commit()
        print("Complete submission successful")

        return {
            "article_id": article.article_id,
            "experience_id": experience.experience_id,
            "data_ids": data_ids,
            "machines_count": len(linked_machines),
            "detectors_count": len(linked_detectors),
            "phantoms_count": len(linked_phantoms),
        }

    except Exception as e:
        db.rollback()
        print(f"Error: {str(e)}")
        # Nettoyage de TOUS les fichiers en cas de crash
        for path in uploaded_file_paths:
            if os.path.exists(path):
                os.remove(path)
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")


@router.post("/submit-experience/{article_id}", status_code=status.HTTP_201_CREATED)
def submit_experience_to_article(
    article_id: int,
    experience_description: str = Form(...),
    machines: str = Form(...),
    detectors: str = Form(...),
    phantoms: str = Form(...),
    
    # --- NOUVEAU : MULTI-FICHIERS ---
    data_metadata: str = Form(...), 
    files: List[UploadFile] = File(default=[]),

    db: Session = Depends(get_db),
):
    """
    Crée une expérience pour un article existant avec gestion multi-fichiers.
    """
    uploaded_file_paths = []
    try:
        print(f"Starting experience submission for article {article_id}...")

        # Step 1: Verify article
        article = db.query(Article).filter(Article.article_id == article_id).first()
        if not article:
            raise HTTPException(status_code=404, detail=f"Article not found")

        # Step 2: Create Experience
        experience = Experience(article_id=article.article_id, description=experience_description)
        db.add(experience)
        db.flush()

        # Step 3: Machines
        machines_data = json.loads(machines)
        linked_machines = []
        for machine_info in machines_data:
            machine = get_or_create_machine(db, constructeur=machine_info.get("manufacturer"), modele=machine_info.get("model"), type_machine=machine_info.get("machineType"))
            linked_machines.append(machine)
            db.add(ExperienceMachine(experience_id=experience.experience_id, machine_id=machine.machine_id, energy=machine_info.get("energy"), collimation=machine_info.get("collimation"), settings=machine_info.get("settings")))
        db.flush()

        # Step 4: Detectors
        detectors_data = json.loads(detectors)
        linked_detectors = []
        for detector_info in detectors_data:
            detector = get_or_create_detector(db, type_detecteur=detector_info.get("detectorType"), modele=detector_info.get("model"), constructeur=detector_info.get("manufacturer"))
            linked_detectors.append(detector)
            db.add(ExperienceDetector(experience_id=experience.experience_id, detector_id=detector.detecteur_id, position=detector_info.get("position"), depth=detector_info.get("depth"), orientation=detector_info.get("orientation")))
        db.flush()

        # Step 5: Phantoms
        phantoms_data = json.loads(phantoms)
        linked_phantoms = []
        for phantom_info in phantoms_data:
            phantom = get_or_create_phantom(db, manufacturer=phantom_info.get("manufacturer"), model=phantom_info.get("model"), phantom_type=phantom_info.get("phantom_type"), dimensions=phantom_info.get("dimensions"), material=phantom_info.get("material"))
            linked_phantoms.append(phantom)
            db.add(ExperiencePhantom(experience_id=experience.experience_id, phantom_id=phantom.phantom_id, position=phantom_info.get("position"), orientation=phantom_info.get("orientation")))
        db.flush()

        # Step 6 & 7: Files and Mappings
        metadata_list = json.loads(data_metadata)
        data_ids = []

        for i, meta in enumerate(metadata_list):
            if i >= len(files):
                break 

            current_file = files[i]
            file_path = f"{UPLOAD_DIR}/{experience.experience_id}_{current_file.filename}"
            
            with open(file_path, "wb") as buffer:
                shutil.copyfileobj(current_file.file, buffer)
            uploaded_file_paths.append(file_path)

            donnee = Donnee(
                experience_id=experience.experience_id,
                data_type=meta.get("dataType", "other"),
                file_format=current_file.filename.split(".")[-1],
                file_path=file_path,
                description=meta.get("description", ""),
            )
            db.add(donnee)
            db.flush()
            data_ids.append(donnee.data_id)

            mappings = meta.get("columnMapping", [])
            for mapping in mappings:
                column_name = mapping.get("column_name") or mapping.get("name")
                data_type_col = mapping.get("data_type") or mapping.get("dataType")
                if column_name and data_type_col:
                    db.add(ColumnMapping(
                        data_id=donnee.data_id,
                        column_name=column_name,
                        column_description=mapping.get("column_description") or mapping.get("description"),
                        data_type=data_type_col,
                        unit=mapping.get("unit"),
                    ))

        db.commit()
        return {
            "article_id": article.article_id,
            "experience_id": experience.experience_id,
            "data_ids": data_ids,
            "machines_count": len(linked_machines),
            "detectors_count": len(linked_detectors),
            "phantoms_count": len(linked_phantoms),
        }

    except Exception as e:
        db.rollback()
        for path in uploaded_file_paths:
            if os.path.exists(path):
                os.remove(path)
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")