import os
from fastapi import Response
from ..services.auth import ACCESS_TOKEN_EXPIRE_MINUTES

ACCESS_COOKIE_NAME = "access_token"

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
