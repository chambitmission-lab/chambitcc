"""
Worship schemas
Single Responsibility: 예배 데이터 검증 및 직렬화
"""
from pydantic import BaseModel
from datetime import datetime, time
from typing import Optional


class WorshipBase(BaseModel):
    """Base worship schema"""
    title: str
    description: Optional[str] = None
    worship_type: str
    day_of_week: Optional[str] = None
    time: Optional[time] = None
    location: Optional[str] = None
    pastor: Optional[str] = None


class WorshipCreate(WorshipBase):
    """Schema for creating worship"""
    pass


class WorshipUpdate(BaseModel):
    """Schema for updating worship"""
    title: Optional[str] = None
    description: Optional[str] = None
    worship_type: Optional[str] = None
    day_of_week: Optional[str] = None
    time: Optional[time] = None
    location: Optional[str] = None
    pastor: Optional[str] = None
    is_active: Optional[int] = None


class WorshipResponse(WorshipBase):
    """Schema for worship response"""
    id: int
    is_active: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True
