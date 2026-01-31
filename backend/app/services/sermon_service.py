"""
Sermon service
Single Responsibility: 설교 비즈니스 로직
"""
from typing import List, Optional
from sqlalchemy.orm import Session
from app.models.sermon import Sermon
from app.schemas.sermon import SermonCreate, SermonUpdate
from app.repositories.sermon_repo import sermon_repository


class SermonService:
    """Service for sermon business logic"""
    
    def get_sermon(self, db: Session, sermon_id: int) -> Optional[Sermon]:
        """Get sermon by id and increment views"""
        sermon = sermon_repository.get(db, sermon_id)
        if sermon:
            sermon_repository.increment_views(db, sermon_id)
        return sermon
    
    def get_all_sermons(
        self,
        db: Session,
        skip: int = 0,
        limit: int = 100
    ) -> List[Sermon]:
        """Get all sermons"""
        return sermon_repository.get_all(db, skip, limit)
    
    def get_published_sermons(
        self,
        db: Session,
        skip: int = 0,
        limit: int = 10
    ) -> List[Sermon]:
        """Get published sermons"""
        return sermon_repository.get_published(db, skip, limit)
    
    def create_sermon(
        self,
        db: Session,
        sermon_in: SermonCreate
    ) -> Sermon:
        """Create new sermon"""
        return sermon_repository.create(db, sermon_in.model_dump())
    
    def update_sermon(
        self,
        db: Session,
        sermon_id: int,
        sermon_in: SermonUpdate
    ) -> Optional[Sermon]:
        """Update sermon"""
        return sermon_repository.update(
            db,
            sermon_id,
            sermon_in.model_dump(exclude_unset=True)
        )
    
    def delete_sermon(self, db: Session, sermon_id: int) -> bool:
        """Delete sermon"""
        return sermon_repository.delete(db, sermon_id)


sermon_service = SermonService()
