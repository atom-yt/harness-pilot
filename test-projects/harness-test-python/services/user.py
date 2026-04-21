"""User service layer."""

from datetime import datetime
from typing import Optional
from models.user import User, UserCreate, UserRole


class UserService:
    """Service for user operations."""

    async def get_user_by_id(self, user_id: str) -> Optional[User]:
        """Get a user by ID."""
        if user_id == "1":
            return User(
                id="1",
                name="Test User",
                email="test@example.com",
                role=UserRole.USER,
                created_at=datetime.now(),
            )
        return None

    async def create_user(self, data: UserCreate) -> User:
        """Create a new user."""
        return User(
            id=str(len(data.name) + 100),
            name=data.name,
            email=data.email,
            role=UserRole.USER,
            created_at=datetime.now(),
        )