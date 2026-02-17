from fastapi import HTTPException
from typing import Optional
import re

def validate_segment_name(segment: Optional[str]) -> Optional[str]:
    """Validate and sanitize grid segment name"""
    if segment is None:
        return None
    
    if not isinstance(segment, str):
        raise HTTPException(status_code=400, detail="Segment must be a string")
    
    segment = segment.strip()
    
    # Check for SQL injection patterns
    sql_patterns = [
        r"(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE)\b)",
        r"(--|;|\*|/\*|\*/)",
        r"(\b(OR|AND)\s+\d+\s*=\s*\d+)",
    ]
    
    for pattern in sql_patterns:
        if re.search(pattern, segment, re.IGNORECASE):
            raise HTTPException(status_code=400, detail="Invalid segment name")
    
    # Check length
    if len(segment) > 100:
        raise HTTPException(status_code=400, detail="Segment name too long")
    
    # Check for valid characters (alphanumeric, spaces, hyphens, underscores)
    if not re.match(r"^[a-zA-Z0-9\s\-_]+$", segment):
        raise HTTPException(status_code=400, detail="Segment name contains invalid characters")
    
    return segment


def validate_hours(hours: int) -> int:
    """Validate hours parameter"""
    if not isinstance(hours, int):
        try:
            hours = int(hours)
        except (ValueError, TypeError):
            raise HTTPException(status_code=400, detail="Hours must be an integer")
    
    if hours < 1:
        raise HTTPException(status_code=400, detail="Hours must be at least 1")
    if hours > 168:  # 7 days
        raise HTTPException(status_code=400, detail="Hours cannot exceed 168 (7 days)")
    
    return hours


def validate_days(days: int) -> int:
    """Validate days parameter"""
    if not isinstance(days, int):
        try:
            days = int(days)
        except (ValueError, TypeError):
            raise HTTPException(status_code=400, detail="Days must be an integer")
    
    if days < 1:
        raise HTTPException(status_code=400, detail="Days must be at least 1")
    if days > 365:
        raise HTTPException(status_code=400, detail="Days cannot exceed 365")
    
    return days


def sanitize_string(value: str, max_length: int = 1000) -> str:
    """Sanitize string input"""
    if not isinstance(value, str):
        raise HTTPException(status_code=400, detail="Value must be a string")
    
    # Remove null bytes
    value = value.replace('\x00', '')
    
    # Truncate if too long
    if len(value) > max_length:
        value = value[:max_length]
    
    return value.strip()

