import os
from fastapi import Response
from ..services.auth import ACCESS_TOKEN_EXPIRE_MINUTES, REFRESH_TOKEN_EXPIRE_DAYS

ACCESS_COOKIE_NAME = "access_token"
REFRESH_COOKIE_NAME = "refresh_token"

_COOKIE_SECURE = os.environ.get("COOKIE_SECURE", "false").lower() in (
    "true",
    "1",
    "yes",
)


def set_access_cookie(response: Response, token: str) -> None:
    response.set_cookie(
        key=ACCESS_COOKIE_NAME,
        value=token,
        max_age=ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        httponly=True,
        secure=_COOKIE_SECURE,
        samesite="lax",
        path="/",
    )


def clear_access_cookie(response: Response) -> None:
    response.delete_cookie(key=ACCESS_COOKIE_NAME, path="/")


def set_refresh_cookie(response: Response, token: str) -> None:
    response.set_cookie(
        key=REFRESH_COOKIE_NAME,
        value=token,
        max_age=REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60,
        httponly=True,
        secure=_COOKIE_SECURE,
        samesite="lax",
        path="/auth",
    )


def clear_refresh_cookie(response: Response) -> None:
    response.delete_cookie(key=REFRESH_COOKIE_NAME, path="/auth")
