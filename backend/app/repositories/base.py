"""
Base repository
Single Responsibility: 공통 CRUD 작업 추상화
Dependency Inversion: 인터페이스 정의
"""
from typing import Generic, TypeVar, Type, Optional, List
from sqlalchemy.orm import Session
from app.core.database import Base

ModelType = TypeVar("ModelType", bound=Base)


class BaseRepository(Generic[ModelType]):
    """Base repository with common CRUD operations"""
    
    def __init__(self, model: Type[ModelType]):
        self.model = model
    
    def get(self, db: Session, id: int) -> Optional[ModelType]:
        """Get single record by id"""
        return db.query(self.model).filter(self.model.id == id).first()
    
    def get_all(
        self,
        db: Session,
        skip: int = 0,
        limit: int = 100
    ) -> List[ModelType]:
        """Get all records with pagination"""
        return db.query(self.model).offset(skip).limit(limit).all()
    
    def create(self, db: Session, obj_in: dict) -> ModelType:
        """Create new record"""
        db_obj = self.model(**obj_in)
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj
    
    def update(
        self,
        db: Session,
        id: int,
        obj_in: dict
    ) -> Optional[ModelType]:
        """Update existing record"""
        db_obj = self.get(db, id)
        if not db_obj:
            return None
        
        for field, value in obj_in.items():
            if value is not None:
                setattr(db_obj, field, value)
        
        db.commit()
        db.refresh(db_obj)
        return db_obj
    
    def delete(self, db: Session, id: int) -> bool:
        """Delete record"""
        db_obj = self.get(db, id)
        if not db_obj:
            return False
        
        db.delete(db_obj)
        db.commit()
        return True
