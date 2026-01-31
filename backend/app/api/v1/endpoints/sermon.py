"""
Sermon endpoints
Single Responsibility: 설교 API 엔드포인트
"""
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.sermon import SermonCreate, SermonUpdate, SermonResponse
from app.services.sermon_service import sermon_service
from app.api.deps import get_current_admin_user
from app.models.user import User


router = APIRouter()


@router.get("/", response_model=List[SermonResponse])
def get_sermons(
    skip: int = 0,
    limit: int = 10,
    db: Session = Depends(get_db)
):
    """Get published sermons"""
    sermons = sermon_service.get_published_sermons(db, skip, limit)
    return sermons


@router.get("/{sermon_id}", response_model=SermonResponse)
def get_sermon(
    sermon_id: int,
    db: Session = Depends(get_db)
):
    """Get sermon by id"""
    sermon = sermon_service.get_sermon(db, sermon_id)
    if not sermon:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Sermon not found"
        )
    return sermon



@router.post("/", response_model=SermonResponse)
def create_sermon(
    sermon_in: SermonCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """Create new sermon (Admin only)"""
    sermon = sermon_service.create_sermon(db, sermon_in)
    return sermon


@router.put("/{sermon_id}", response_model=SermonResponse)
def update_sermon(
    sermon_id: int,
    sermon_in: SermonUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """Update sermon (Admin only)"""
    sermon = sermon_service.update_sermon(db, sermon_id, sermon_in)
    if not sermon:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Sermon not found"
        )
    return sermon


@router.delete("/{sermon_id}")
def delete_sermon(
    sermon_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """Delete sermon (Admin only)"""
    success = sermon_service.delete_sermon(db, sermon_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Sermon not found"
        )
    return {"message": "Sermon deleted successfully"}
