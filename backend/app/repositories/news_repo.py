"""
News repository
Single Responsibility: 교회 소식 데이터 접근
"""
from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import desc
from app.models.news import News
from app.repositories.base import BaseRepository


class NewsRepository(BaseRepository[News]):
    """Repository for news operations"""
    
    def __init__(self):
        super().__init__(News)
    
    def get_published(
        self,
        db: Session,
        skip: int = 0,
        limit: int = 10
    ) -> List[News]:
        """Get published news ordered by date"""
        return db.query(News).filter(
            News.is_published == 1
        ).order_by(
            desc(News.published_at)
        ).offset(skip).limit(limit).all()
    
    def get_by_category(
        self,
        db: Session,
        category: str,
        skip: int = 0,
        limit: int = 10
    ) -> List[News]:
        """Get news by category"""
        return db.query(News).filter(
            News.category == category,
            News.is_published == 1
        ).order_by(
            desc(News.published_at)
        ).offset(skip).limit(limit).all()
    
    def increment_views(self, db: Session, id: int) -> bool:
        """Increment news views"""
        news = self.get(db, id)
        if not news:
            return False
        
        news.views += 1
        db.commit()
        return True


news_repository = NewsRepository()
