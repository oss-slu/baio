from fastapi import Depends, HTTPException
from ..database import get_db
from sqlalchemy.orm import Session
from ..models import User


def get_user_by_id(db: Session, user_id: int):
    return db.query(User).filter(User.id == user_id).first()


def get_current_user(
    db: Session = Depends(get_db),
):
    # TODO: Add JWT authentication:
    # - Extract token from Authorization header
    # - Decode token
    # - Validate user identity

    # Temporary: just return the first user (for testing only)
    user = db.query(User).first()

    if not user:
        raise HTTPException(status_code=404, detail="No users found")

    return user
