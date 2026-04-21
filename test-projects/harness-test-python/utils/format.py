"""Utility functions."""

from datetime import datetime


def format_date(date: datetime) -> str:
    """Format a date to a readable string."""
    return date.strftime("%B %d, %Y")


def capitalize_string(text: str) -> str:
    """Capitalize the first letter of a string."""
    return text[0].upper() + text[1:] if text else text