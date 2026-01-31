"""
User repository
Single Responsibility: 사용자 데이터 접근
"""
from typing import Optional
from sqlalchemy.orm import Session
from app.models.user import User
from app.repositories.base import BaseRepository


class UserRepository(BaseRepository[User]):
    """Repository for user operations"""
    
    def __init__(self):
        super().__init__(User)
    
    def get_by_email(self, db: Session, email: str) -> Optional[User]:
        """Get user by email"""
        return db.query(User).filter(User.email == email).first()
    
    def get_by_username(
        self,
        db: Session,
        username: str
    ) -> Optional[User]:
        """Get user by username"""
        return db.query(User).filter(User.username == username).first()


user_repository = UserRepository()
