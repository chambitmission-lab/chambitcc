"""Repositories for data access"""
from app.repositories.user_repo import user_repository
from app.repositories.worship_repo import worship_repository
from app.repositories.sermon_repo import sermon_repository
from app.repositories.news_repo import news_repository

__all__ = [
    "user_repository",
    "worship_repository",
    "sermon_repository",
    "news_repository",
]
