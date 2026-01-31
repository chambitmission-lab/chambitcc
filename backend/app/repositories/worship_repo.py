"""
Worship repository
Single Responsibility: 예배 데이터 접근
"""
from typing import List
from sqlalchemy.orm import Session
from app.models.worship import Worship
from app.repositories.base import BaseRepository


class WorshipRepository(BaseRepository[Worship]):
    """Repository for worship operations"""
    
    def __init__(self):
        super().__init__(Worship)
    
    def get_active(self, db: Session) -> List[Worship]:
        """Get all active worships"""
        return db.query(Worship).filter(Worship.is_active == 1).all()
    
    def get_by_type(
        self,
        db: Session,
        worship_type: str
    ) -> List[Worship]:
        """Get worships by type"""
        return db.query(Worship).filter(
            Worship.worship_type == worship_type,
            Worship.is_active == 1
        ).all()


worship_repository = WorshipRepository()
