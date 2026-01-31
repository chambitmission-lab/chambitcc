"""
Worship endpoints
Single Responsibility: 예배 API 엔드포인트
"""
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.worship import (
    WorshipCreate,
    WorshipUpdate,
    WorshipResponse
)
from app.services.worship_service import worship_service
from app.api.deps import get_current_admin_user
from app.models.user import User


router = APIRouter()


@router.get("/", response_model=List[WorshipResponse])
def get_worships(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """Get all worships"""
    worships = worship_service.get_all_worships(db, skip, limit)
    return worships


@router.get("/active", response_model=List[WorshipResponse])
def get_active_worships(db: Session = Depends(get_db)):
    """Get active worships"""
    worships = worship_service.get_active_worships(db)
    return worships



@router.get("/{worship_id}", response_model=WorshipResponse)
def get_worship(
    worship_id: int,
    db: Session = Depends(get_db)
):
    """Get worship by id"""
    worship = worship_service.get_worship(db, worship_id)
    if not worship:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Worship not found"
        )
    return worship


@router.post("/", response_model=WorshipResponse)
def create_worship(
    worship_in: WorshipCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """Create new worship (Admin only)"""
    worship = worship_service.create_worship(db, worship_in)
    return worship


@router.put("/{worship_id}", response_model=WorshipResponse)
def update_worship(
    worship_id: int,
    worship_in: WorshipUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """Update worship (Admin only)"""
    worship = worship_service.update_worship(db, worship_id, worship_in)
    if not worship:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Worship not found"
        )
    return worship


@router.delete("/{worship_id}")
def delete_worship(
    worship_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """Delete worship (Admin only)"""
    success = worship_service.delete_worship(db, worship_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Worship not found"
        )
    return {"message": "Worship deleted successfully"}
