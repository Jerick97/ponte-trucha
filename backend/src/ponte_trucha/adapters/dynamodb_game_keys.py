"""Claves DynamoDB de la partición infantil (ADR-003): reto y progreso."""

from __future__ import annotations

PROGRESS_SK = "PROGRESS#MAIN"


def child_pk(child_id: str) -> str:
    return f"CHILD#{child_id}"


def challenge_sk(challenge_id: str) -> str:
    return f"CHALLENGE#{challenge_id}"


CHALLENGE_SK_PREFIX = "CHALLENGE#"
