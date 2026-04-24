from fastapi import APIRouter, HTTPException, status, Depends, Response
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from ..database import get_db
from ..models.user import User
from ..schemas.auth import UserCreate, UserLogin
from ..schemas.user import UserResponse
from ..services.auth import create_access_token, hash_password, verify_password
from ..utils.cookies import set_access_cookie, clear_access_cookie

_DUMMY_HASH = hash_password("never-matches-any-real-password")

router = APIRouter(prefix="/auth", tags=["Auth"])


@router.post(
    "/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED
)
def register(
    payload: UserCreate, response: Response, db: Session = Depends(get_db)
) -> User:
    user = User(
        name=payload.name,
        email=payload.email,
        hashed_password=hash_password(payload.password),
    )

    db.add(user)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status.HTTP_409_CONFLICT, "Email already registered")
    db.refresh(user)
    set_access_cookie(response, create_access_token({"sub": str(user.id)}))

    return user


@router.post("/login", response_model=UserResponse)
def login(
    credentials: UserLogin, response: Response, db: Session = Depends(get_db)
) -> User:
    user = db.query(User).filter(User.email == credentials.email).first()
    hashed = user.hashed_password if user else _DUMMY_HASH
    if not verify_password(credentials.password, hashed) or user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )
    set_access_cookie(response, create_access_token({"sub": str(user.id)}))

    return user


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
def logout(response: Response) -> None:
    clear_access_cookie(response)
