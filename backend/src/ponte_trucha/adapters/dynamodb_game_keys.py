"""Claves DynamoDB de la partición infantil (ADR-003): reto y progreso."""

from __future__ import annotations

PROGRESS_SK = "PROGRESS#MAIN"


def child_pk(child_id: str) -> str:
    return f"CHILD#{child_id}"


def challenge_sk(challenge_id: str) -> str:
    return f"CHALLENGE#{challenge_id}"


def attempt_sk(answered_at: str, attempt_id: str) -> str:
    return f"ATTEMPT#{answered_at}#{attempt_id}"


CHALLENGE_SK_PREFIX = "CHALLENGE#"
