"""User data models."""

from datetime import datetime
from typing import Literal
from pydantic import BaseModel, EmailStr


class UserRole:
    ADMIN = "admin"
    USER = "user"
    GUEST = "guest"


UserRoleType = Literal[UserRole.ADMIN, UserRole.USER, UserRole.GUEST]


class UserBase(BaseModel):
    """Base user model."""
    name: str
    email: EmailStr


class UserCreate(UserBase):
    """User creation model."""
    password: str


class User(UserBase):
    """User model."""
    id: str
    role: UserRoleType
    created_at: datetime

    class Config:
        from_attributes = True


class ApiResponse(BaseModel):
    """API response wrapper."""
    success: bool
    data: User
    error: str | None = None