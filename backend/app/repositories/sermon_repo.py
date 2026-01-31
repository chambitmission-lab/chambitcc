"""
Sermon repository
Single Responsibility: 설교 데이터 접근
"""
from typing import List
from sqlalchemy.orm import Session
from sqlalchemy import desc
from app.models.sermon import Sermon
from app.repositories.base import BaseRepository


class SermonRepository(BaseRepository[Sermon]):
    """Repository for sermon operations"""
    
    def __init__(self):
        super().__init__(Sermon)
    
    def get_published(
        self,
        db: Session,
        skip: int = 0,
        limit: int = 10
    ) -> List[Sermon]:
        """Get published sermons ordered by date"""
        return db.query(Sermon).filter(
            Sermon.is_published == 1
        ).order_by(
            desc(Sermon.sermon_date)
        ).offset(skip).limit(limit).all()
    
    def increment_views(self, db: Session, id: int) -> bool:
        """Increment sermon views"""
        sermon = self.get(db, id)
        if not sermon:
            return False
        
        sermon.views += 1
        db.commit()
        return True


sermon_repository = SermonRepository()
