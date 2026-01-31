"""
Authentication service
Single Responsibility: 인증 비즈니스 로직
"""
from typing import Optional
from sqlalchemy.orm import Session
from app.models.user import User
from app.schemas.user import UserCreate
from app.repositories.user_repo import user_repository
from app.core.security import (
    verify_password,
    get_password_hash,
    create_access_token
)


class AuthService:
    """Service for authentication logic"""
    
    def authenticate_user(
        self,
        db: Session,
        username: str,
        password: str
    ) -> Optional[User]:
        """Authenticate user with username and password"""
        user = user_repository.get_by_username(db, username)
        if not user:
            return None
        if not verify_password(password, user.hashed_password):
            return None
        return user
    
    def create_user(self, db: Session, user_in: UserCreate) -> User:
        """Create new user"""
        hashed_password = get_password_hash(user_in.password)
        user_data = {
            "email": user_in.email,
            "username": user_in.username,
            "hashed_password": hashed_password,
            "full_name": user_in.full_name,
            "is_active": True,
            "is_admin": False
        }
        return user_repository.create(db, user_data)
    
    def get_user_by_email(
        self,
        db: Session,
        email: str
    ) -> Optional[User]:
        """Get user by email"""
        return user_repository.get_by_email(db, email)
    
    def get_user_by_username(
        self,
        db: Session,
        username: str
    ) -> Optional[User]:
        """Get user by username"""
        return user_repository.get_by_username(db, username)
    
    def create_token(self, user_id: int) -> str:
        """Create access token for user"""
        return create_access_token(data={"sub": str(user_id)})


auth_service = AuthService()
