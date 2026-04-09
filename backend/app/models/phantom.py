from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base


class Phantom(Base):
    __tablename__ = "phantoms"

    phantom_id = Column(Integer, primary_key=True)
    phantom_type = Column(String)
    manufacturer = Column(String)
    model = Column(String)
    dimensions = Column(String)
    material = Column(String)

    # Relation vers ExperiencePhantom
    experiences = relationship("ExperiencePhantom", back_populates="phantom")
