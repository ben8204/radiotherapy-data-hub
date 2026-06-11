from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy.exc import DatabaseError

from app.database import SessionLocal
from app.models.article import Article
from app.models.experience import Experience
from app.schemas.article import ArticleCreate, ArticleOut

router = APIRouter(prefix="/articles", tags=["Articles"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/", status_code=status.HTTP_201_CREATED)
def create_article(article: ArticleCreate, db: Session = Depends(get_db)):
    """
    Crée un nouvel article, ou récupère l'article existant si le DOI est déjà enregistré.
    """
    # 1. Vérification du DOI
    if article.doi:
        existing_article = db.query(Article).filter(Article.doi == article.doi).first()
        if existing_article:
            # SÉCURITÉ : Au lieu de bloquer l'utilisateur avec une erreur 409, 
            # on renvoie discrètement l'article existant. 
            # Le frontend recevra son 'article_id' et pourra continuer sa route !
            return existing_article

    # 2. Si le DOI n'existe pas, on procède à la création normale
    db_article = Article(**article.dict())
    db.add(db_article)

    try:
        db.commit()
    except DatabaseError:
        db.rollback()
        raise HTTPException(
            status_code=409,
            detail="Database Error"
        )

    db.refresh(db_article)
    return db_article

@router.get("/")
def list_articles(db: Session = Depends(get_db)):
    """
    Liste tous les articles.
    """
    return db.query(Article).all()

@router.get("/{article_id}", response_model=ArticleOut)
def get_article(article_id: int, db: Session = Depends(get_db)):
    """
    Récupère un article avec ses expériences.
    """
    article = db.query(Article).filter(Article.article_id == article_id).first()
    if not article:
        raise HTTPException(status_code=404, detail="Article not found")
    return article

@router.get("/{article_id}/experiences")
def get_article_experiences(article_id: int, db: Session = Depends(get_db)):
    """
    Récupère toutes les expériences d'un article.
    """
    article = db.query(Article).filter(Article.article_id == article_id).first()
    if not article:
        raise HTTPException(status_code=404, detail="Article not found")
    
    experiences = db.query(Experience).filter(
        Experience.article_id == article_id
    ).all()
    
    return {
        "article_id": article.article_id,
        "titre": article.titre,
        "auteurs": article.auteurs,
        "doi": article.doi,
        "experiences": [
            {
                "experience_id": exp.experience_id,
                "description": exp.description,
                "machine_count": len(exp.machines),
                "detector_count": len(exp.detectors),
                "phantom_count": len(exp.phantoms),
                "data_count": len(exp.donnees)
            }
            for exp in experiences
        ]
    }
