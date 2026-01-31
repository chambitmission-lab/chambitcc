"""
News model
Single Responsibility: 교회 소식 데이터 구조 정의
"""
from sqlalchemy import Column, Integer, String, Text, DateTime
from sqlalchemy.sql import func
from app.core.database import Base


class News(Base):
    """Church news and announcements"""
    
    __tablename__ = "news"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False)
    content = Column(Text, nullable=False)
    category = Column(String(50))  # 공지사항, 행사, 소식 등
    author = Column(String(100))
    thumbnail_url = Column(String(500))
    views = Column(Integer, default=0)
    is_published = Column(Integer, default=1)
    published_at = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now()
    )
