from fastapi import APIRouter, HTTPException, status, Depends, Response, Request
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
import jwt

from ..database import get_db
from ..models.user import User
from ..models.refresh_token import RefreshToken
from ..schemas.auth import UserCreate, UserLogin
from ..schemas.user import UserResponse
from ..services.auth import (
    create_access_token,
    create_refresh_token,
    hash_password,
    verify_password,
    decode_token,
)
from ..utils.cookies import (
    set_access_cookie,
    clear_access_cookie,
    set_refresh_cookie,
    clear_refresh_cookie,
    REFRESH_COOKIE_NAME,
)

_DUMMY_HASH = hash_password("never-matches-any-real-password")


def _revoke_all_user_refresh_tokens(db: Session, user_id: int) -> None:
    db.query(RefreshToken).filter(RefreshToken.user_id == user_id).update(
        {"revoked": True}
    )
    db.commit()


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
    set_refresh_cookie(response, create_refresh_token(db, user.id))

    return user


@router.post("/login", response_model=UserResponse)
def login(
    credentials: UserLogin, response: Response, db: Session = Depends(get_db)
) -> User:
    user = db.query(User).filter(User.email == credentials.email).first()
    hashed = user.hashed_password if user else _DUMMY_HASH
    if not verify_password(credentials.password, hashed) or user is None:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Incorrect email or password")
    set_access_cookie(response, create_access_token({"sub": str(user.id)}))
    set_refresh_cookie(response, create_refresh_token(db, user.id))

    return user


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
def logout(request: Request, response: Response, db: Session = Depends(get_db)) -> None:
    token = request.cookies.get(REFRESH_COOKIE_NAME)
    if token is not None:
        try:
            payload = decode_token(token)
            jti = payload.get("jti")
            if jti is not None:
                db.query(RefreshToken).filter(RefreshToken.jti == jti).update(
                    {"revoked": True}
                )
                db.commit()
        except jwt.PyJWTError:
            pass

    clear_access_cookie(response)
    clear_refresh_cookie(response)


@router.post("/refresh", status_code=status.HTTP_204_NO_CONTENT, response_model=None)
def refresh(
    request: Request, response: Response, db: Session = Depends(get_db)
) -> Response | None:
    token = request.cookies.get(REFRESH_COOKIE_NAME)
    if token is None:
        raise HTTPException(
            status.HTTP_401_UNAUTHORIZED, "Could not validate credentials"
        )

    try:
        payload = decode_token(token)
    except jwt.PyJWTError:
        raise HTTPException(
            status.HTTP_401_UNAUTHORIZED, "Could not validate credentials"
        )

    if payload.get("typ") != "refresh":
        raise HTTPException(
            status.HTTP_401_UNAUTHORIZED, "Could not validate credentials"
        )

    jti = payload["jti"]
    user_id = int(payload["sub"])

    row = db.query(RefreshToken).filter(RefreshToken.jti == jti).first()
    if row is None:
        raise HTTPException(
            status.HTTP_401_UNAUTHORIZED, "Could not validate credentials"
        )
    if row.revoked:
        _revoke_all_user_refresh_tokens(db, user_id)
        resp = JSONResponse(
            status_code=status.HTTP_401_UNAUTHORIZED,
            content={"detail": "Could not validate credentials"},
        )
        clear_access_cookie(resp)
        clear_refresh_cookie(resp)

        return resp

    row.revoked = True
    db.commit()

    set_access_cookie(response, create_access_token({"sub": str(user_id)}))
    set_refresh_cookie(response, create_refresh_token(db, user_id))
