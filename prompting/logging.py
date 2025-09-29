"""Minimal structured logging helpers for prompting package.

Uses the standard logging module but formats messages as key/value JSON-ish dicts
for easier downstream parsing.
"""
import logging
import json
from typing import Any, Dict


logger = logging.getLogger("prompting")
if not logger.handlers:
    handler = logging.StreamHandler()
    formatter = logging.Formatter('%(message)s')
    handler.setFormatter(formatter)
    logger.addHandler(handler)
logger.setLevel(logging.INFO)


def info(msg: str, **kwargs: Any) -> None:
    payload: Dict[str, Any] = {"msg": msg}
    payload.update(kwargs)
    logger.info(json.dumps(payload, default=str))


def error(msg: str, **kwargs: Any) -> None:
    payload: Dict[str, Any] = {"msg": msg}
    payload.update(kwargs)
    logger.error(json.dumps(payload, default=str))
