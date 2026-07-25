from __future__ import annotations

import pytest

from ponte_trucha.adapters.parent_ref import HmacParentRefDeriver


def test_same_sub_and_key_produce_the_same_parent_ref() -> None:
    deriver = HmacParentRefDeriver(secret_key=b"clave-de-prueba", key_version="v1")

    first = deriver.derive(cognito_sub="sub-123")
    second = deriver.derive(cognito_sub="sub-123")

    assert first == second


def test_different_subs_produce_different_parent_refs() -> None:
    deriver = HmacParentRefDeriver(secret_key=b"clave-de-prueba", key_version="v1")

    assert deriver.derive(cognito_sub="sub-a") != deriver.derive(cognito_sub="sub-b")


def test_parent_ref_never_contains_the_raw_sub() -> None:
    deriver = HmacParentRefDeriver(secret_key=b"clave-de-prueba", key_version="v1")

    parent_ref = deriver.derive(cognito_sub="sub-secreto-123")

    assert "sub-secreto-123" not in parent_ref


def test_empty_secret_key_is_rejected() -> None:
    with pytest.raises(ValueError):
        HmacParentRefDeriver(secret_key=b"", key_version="v1")
