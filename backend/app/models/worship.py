"""
Worship model
Single Responsibility: 예배 데이터 구조 정의
"""
from sqlalchemy import Column, Integer, String, Text, DateTime, Time
from sqlalchemy.sql import func
from app.core.database import Base


class Worship(Base):
    """Worship schedule and information"""
    
    __tablename__ = "worships"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False)
    description = Column(Text)
    worship_type = Column(String(50), nullable=False)  # 주일예배, 수요예배 등
    day_of_week = Column(String(20))  # 요일
    time = Column(Time)  # 예배 시간
    location = Column(String(200))  # 장소
    pastor = Column(String(100))  # 담당 목사
    is_active = Column(Integer, default=1)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now()
    )
