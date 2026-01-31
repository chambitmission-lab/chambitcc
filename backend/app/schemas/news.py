"""
News schemas
Single Responsibility: 교회 소식 데이터 검증 및 직렬화
"""
from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class NewsBase(BaseModel):
    """Base news schema"""
    title: str
    content: str
    category: Optional[str] = None
    author: Optional[str] = None
    thumbnail_url: Optional[str] = None


class NewsCreate(NewsBase):
    """Schema for creating news"""
    pass


class NewsUpdate(BaseModel):
    """Schema for updating news"""
    title: Optional[str] = None
    content: Optional[str] = None
    category: Optional[str] = None
    author: Optional[str] = None
    thumbnail_url: Optional[str] = None
    is_published: Optional[int] = None
    published_at: Optional[datetime] = None


class NewsResponse(NewsBase):
    """Schema for news response"""
    id: int
    views: int
    is_published: int
    published_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True
