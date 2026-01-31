"""
News endpoints
Single Responsibility: 교회 소식 API 엔드포인트
"""
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.news import NewsCreate, NewsUpdate, NewsResponse
from app.services.news_service import news_service
from app.api.deps import get_current_admin_user
from app.models.user import User


router = APIRouter()


@router.get("/", response_model=List[NewsResponse])
def get_news_list(
    skip: int = 0,
    limit: int = 10,
    category: str = None,
    db: Session = Depends(get_db)
):
    """Get published news"""
    if category:
        news = news_service.get_news_by_category(db, category, skip, limit)
    else:
        news = news_service.get_published_news(db, skip, limit)
    return news


@router.get("/{news_id}", response_model=NewsResponse)
def get_news(
    news_id: int,
    db: Session = Depends(get_db)
):
    """Get news by id"""
    news = news_service.get_news(db, news_id)
    if not news:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="News not found"
        )
    return news



@router.post("/", response_model=NewsResponse)
def create_news(
    news_in: NewsCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """Create new news (Admin only)"""
    news = news_service.create_news(db, news_in)
    return news


@router.put("/{news_id}", response_model=NewsResponse)
def update_news(
    news_id: int,
    news_in: NewsUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """Update news (Admin only)"""
    news = news_service.update_news(db, news_id, news_in)
    if not news:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="News not found"
        )
    return news


@router.delete("/{news_id}")
def delete_news(
    news_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """Delete news (Admin only)"""
    success = news_service.delete_news(db, news_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="News not found"
        )
    return {"message": "News deleted successfully"}
