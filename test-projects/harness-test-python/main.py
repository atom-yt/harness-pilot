"""FastAPI application entry point."""

from fastapi import FastAPI
from services.user import UserService

app = FastAPI(title="Harness Test Python API")
user_service = UserService()


@app.get("/")
async def root():
    """Root endpoint."""
    return {"message": "Welcome to Harness Test Python API"}


@app.get("/users/{user_id}")
async def get_user(user_id: str):
    """Get a user by ID."""
    user = await user_service.get_user_by_id(user_id)
    if not user:
        return {"error": "User not found"}
    return user


@app.post("/users")
async def create_user(data: dict):
    """Create a new user."""
    from models.user import UserCreate
    user_data = UserCreate(**data)
    user = await user_service.create_user(user_data)
    return user