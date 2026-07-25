from __future__ import annotations

import base64

import pytest

from ponte_trucha.adapters.hmac_digest import compute_digest
from ponte_trucha.entrypoints.http import composition


class _FakeSecretsManager:
    def __init__(self, secret: bytes) -> None:
        self._secret = secret

    def get_secret_value(self, *, SecretId: str) -> dict[str, str]:
        assert SecretId == "arn:aws:secretsmanager:us-east-1:123456789012:secret:parent-ref"
        return {"SecretString": base64.b64encode(self._secret).decode("ascii")}


def test_parent_ref_deriver_reads_the_secret_from_secrets_manager(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    secret = b"a-production-grade-secret"
    fake_secrets_manager = _FakeSecretsManager(secret)

    def fake_client(service_name: str) -> _FakeSecretsManager:
        assert service_name == "secretsmanager"
        return fake_secrets_manager

    monkeypatch.delenv("PARENT_REF_HMAC_SECRET", raising=False)
    monkeypatch.setenv(
        "HMAC_SECRET_ARN",
        "arn:aws:secretsmanager:us-east-1:123456789012:secret:parent-ref",
    )
    monkeypatch.setattr(composition.boto3, "client", fake_client)

    deriver = composition.build_parent_ref_deriver()

    assert deriver.derive(cognito_sub="adult-sub") == compute_digest(
        secret_key=secret,
        payload="adult-sub",
    )


def test_persistent_mode_refuses_to_use_the_development_secret(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.delenv("PARENT_REF_HMAC_SECRET", raising=False)
    monkeypatch.delenv("HMAC_SECRET_ARN", raising=False)
    monkeypatch.setenv("DOMAIN_TABLE_NAME", "ptk-domain-dev")

    with pytest.raises(RuntimeError, match="secreto HMAC"):
        composition.build_parent_ref_deriver()
