"""
Worship service
Single Responsibility: 예배 비즈니스 로직
"""
from typing import List, Optional
from sqlalchemy.orm import Session
from app.models.worship import Worship
from app.schemas.worship import WorshipCreate, WorshipUpdate
from app.repositories.worship_repo import worship_repository


class WorshipService:
    """Service for worship business logic"""
    
    def get_worship(self, db: Session, worship_id: int) -> Optional[Worship]:
        """Get worship by id"""
        return worship_repository.get(db, worship_id)
    
    def get_all_worships(
        self,
        db: Session,
        skip: int = 0,
        limit: int = 100
    ) -> List[Worship]:
        """Get all worships"""
        return worship_repository.get_all(db, skip, limit)
    
    def get_active_worships(self, db: Session) -> List[Worship]:
        """Get active worships"""
        return worship_repository.get_active(db)
    
    def create_worship(
        self,
        db: Session,
        worship_in: WorshipCreate
    ) -> Worship:
        """Create new worship"""
        return worship_repository.create(db, worship_in.model_dump())
    
    def update_worship(
        self,
        db: Session,
        worship_id: int,
        worship_in: WorshipUpdate
    ) -> Optional[Worship]:
        """Update worship"""
        return worship_repository.update(
            db,
            worship_id,
            worship_in.model_dump(exclude_unset=True)
        )
    
    def delete_worship(self, db: Session, worship_id: int) -> bool:
        """Delete worship"""
        return worship_repository.delete(db, worship_id)


worship_service = WorshipService()
