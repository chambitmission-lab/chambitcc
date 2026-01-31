"""
News service
Single Responsibility: 교회 소식 비즈니스 로직
"""
from typing import List, Optional
from sqlalchemy.orm import Session
from app.models.news import News
from app.schemas.news import NewsCreate, NewsUpdate
from app.repositories.news_repo import news_repository


class NewsService:
    """Service for news business logic"""
    
    def get_news(self, db: Session, news_id: int) -> Optional[News]:
        """Get news by id and increment views"""
        news = news_repository.get(db, news_id)
        if news:
            news_repository.increment_views(db, news_id)
        return news
    
    def get_all_news(
        self,
        db: Session,
        skip: int = 0,
        limit: int = 100
    ) -> List[News]:
        """Get all news"""
        return news_repository.get_all(db, skip, limit)
    
    def get_published_news(
        self,
        db: Session,
        skip: int = 0,
        limit: int = 10
    ) -> List[News]:
        """Get published news"""
        return news_repository.get_published(db, skip, limit)
    
    def get_news_by_category(
        self,
        db: Session,
        category: str,
        skip: int = 0,
        limit: int = 10
    ) -> List[News]:
        """Get news by category"""
        return news_repository.get_by_category(db, category, skip, limit)
    
    def create_news(self, db: Session, news_in: NewsCreate) -> News:
        """Create new news"""
        return news_repository.create(db, news_in.model_dump())
    
    def update_news(
        self,
        db: Session,
        news_id: int,
        news_in: NewsUpdate
    ) -> Optional[News]:
        """Update news"""
        return news_repository.update(
            db,
            news_id,
            news_in.model_dump(exclude_unset=True)
        )
    
    def delete_news(self, db: Session, news_id: int) -> bool:
        """Delete news"""
        return news_repository.delete(db, news_id)


news_service = NewsService()
