"""
API v1 router
Single Responsibility: API 라우팅 관리
"""
from fastapi import APIRouter
from app.api.v1.endpoints import auth, worship, sermon, news


api_router = APIRouter()

# Include all endpoint routers
api_router.include_router(
    auth.router,
    prefix="/auth",
    tags=["인증"]
)

api_router.include_router(
    worship.router,
    prefix="/worships",
    tags=["예배"]
)

api_router.include_router(
    sermon.router,
    prefix="/sermons",
    tags=["설교"]
)

api_router.include_router(
    news.router,
    prefix="/news",
    tags=["교회소식"]
)
