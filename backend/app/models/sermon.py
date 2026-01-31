"""
Sermon model
Single Responsibility: 설교 데이터 구조 정의
"""
from sqlalchemy import Column, Integer, String, Text, DateTime, Date
from sqlalchemy.sql import func
from app.core.database import Base


class Sermon(Base):
    """Sermon content and media"""
    
    __tablename__ = "sermons"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False)
    pastor = Column(String(100), nullable=False)
    bible_verse = Column(String(200))  # 성경 구절
    sermon_date = Column(Date, nullable=False)
    content = Column(Text)  # 설교 내용
    video_url = Column(String(500))  # 영상 URL
    audio_url = Column(String(500))  # 음성 URL
    thumbnail_url = Column(String(500))  # 썸네일
    views = Column(Integer, default=0)
    is_published = Column(Integer, default=1)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now()
    )
