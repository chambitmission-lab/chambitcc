"""
Sermon schemas
Single Responsibility: 설교 데이터 검증 및 직렬화
"""
from pydantic import BaseModel
from datetime import datetime, date
from typing import Optional


class SermonBase(BaseModel):
    """Base sermon schema"""
    title: str
    pastor: str
    bible_verse: Optional[str] = None
    sermon_date: date
    content: Optional[str] = None
    video_url: Optional[str] = None
    audio_url: Optional[str] = None
    thumbnail_url: Optional[str] = None


class SermonCreate(SermonBase):
    """Schema for creating sermon"""
    pass


class SermonUpdate(BaseModel):
    """Schema for updating sermon"""
    title: Optional[str] = None
    pastor: Optional[str] = None
    bible_verse: Optional[str] = None
    sermon_date: Optional[date] = None
    content: Optional[str] = None
    video_url: Optional[str] = None
    audio_url: Optional[str] = None
    thumbnail_url: Optional[str] = None
    is_published: Optional[int] = None


class SermonResponse(SermonBase):
    """Schema for sermon response"""
    id: int
    views: int
    is_published: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True
