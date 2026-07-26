"""Recorrido completo del API, reutilizable contra cualquier despliegue HTTP.

Lo usan dos scripts con identidades distintas:

- `smoke_local.py`: gateway local en memoria, token de desarrollo;
- `smoke_floci.py`: API Gateway + Lambda + DynamoDB del emulador, con login
  real contra el User Pool de Cognito.

El flujo es el mismo en los dos casos porque el contrato HTTP es el mismo: si
un paso cambia de comportamiento entre memoria y persistencia, aquí se ve.
"""

from __future__ import annotations

import secrets
from typing import Any, Protocol

import httpx

GRADING_FIELDS = ("respuestaCorrecta", "senales", "leccion", "perfilEstafador", "tipo")
POLICY_VERSION = "politica-2026-07-v1"
AGE_GATE_RULE_VERSION = "age-gate-v1"


class SmokeError(RuntimeError):
    """Un paso del flujo no respondió lo esperado."""


class Identities(Protocol):
    """Provee headers de autorización de adultos distintos e independientes."""

    def new_adult(self) -> dict[str, str]: ...


def _ok(step: str, detail: str = "") -> None:
    print(f"  ok  {step}{f' — {detail}' if detail else ''}")


def _expect(response: httpx.Response, status: int, step: str) -> Any:
    if response.status_code != status:
        raise SmokeError(f"{step}: se esperaba {status} y llegó {response.status_code}")
    if response.status_code == 204 or not response.content:
        return None
    return response.json()


def _grant(client: httpx.Client, *, headers: dict[str, str], purpose: str) -> None:
    body = {"decision": "grant", "policyVersion": POLICY_VERSION, "method": "explicit-click"}
    request_headers = {**headers, "Idempotency-Key": f"consent-{purpose}-{secrets.token_hex(4)}"}
    _expect(
        client.patch(f"/v1/consentimientos/{purpose}", json=body, headers=request_headers),
        200,
        f"consentimiento {purpose}",
    )
    _ok(f"consentimiento {purpose} otorgado")


def run(client: httpx.Client, identities: Identities) -> None:
    headers = identities.new_adult()

    print("1. Salud de las dos APIs")
    _expect(client.get("/v1/health"), 200, "health api-core")
    _expect(client.get("/v1/ia/health"), 200, "health api-ia")
    _ok("api-core y api-ia responden")

    print("2. Sin token no se entra")
    _expect(client.get("/v1/me"), 401, "me sin token")
    _ok("/v1/me sin token responde 401")

    print("3. Catálogo público de apps")
    apps = _expect(client.get("/v1/apps"), 200, "catálogo de apps")
    _ok("apps disponibles", ", ".join(app["appType"] for app in apps))

    print("4. Cuenta del adulto")
    account = _expect(
        client.post(
            "/v1/cuenta", json={"ageGateRuleVersion": AGE_GATE_RULE_VERSION}, headers=headers
        ),
        200,
        "crear cuenta",
    )
    _ok("cuenta creada", f"estado {account['status']}")

    print("5. Consentimientos")
    _grant(client, headers=headers, purpose="core")
    _grant(client, headers=headers, purpose="serverSideAi")
    consents = _expect(
        client.get("/v1/consentimientos", headers=headers), 200, "listar consentimientos"
    )
    _ok(
        "consentimientos vigentes",
        ", ".join(f"{item['purpose']}={item['state']}" for item in consents),
    )

    print("6. Perfil infantil")
    profile = _expect(
        client.post(
            "/v1/perfiles",
            json={"aliasId": "zorro-listo", "avatarId": "zorro", "ageBand": "8-10"},
            headers=headers,
        ),
        201,
        "crear perfil",
    )
    child_id = profile["childId"]
    _ok("perfil creado", f"{profile['aliasId']} · banda {profile['ageBand']}")

    print("7. Reto")
    challenge = _expect(
        client.get(f"/v1/perfiles/{child_id}/retos/siguiente", headers=headers),
        200,
        "pedir reto",
    )
    leaked = [field for field in GRADING_FIELDS if field in challenge["payload"]]
    if leaked:
        raise SmokeError(f"el reto filtró campos de calificación: {leaked}")
    _ok("reto emitido", f"app {challenge['appType']} · dificultad {challenge['difficulty']}")
    _ok("el reto no trae respuesta correcta ni señales")

    print("8. Intento y su reintento")
    challenge_id = challenge["challengeId"]
    attempt_headers = {**headers, "Idempotency-Key": f"intento-{secrets.token_hex(4)}"}
    body = {"decision": "trap", "responseTimeBucket": "under-10s"}
    attempt_url = f"/v1/retos/{challenge_id}/intentos"
    first = _expect(client.post(attempt_url, json=body, headers=attempt_headers), 200, "intento")
    replayed = client.post(attempt_url, json=body, headers=attempt_headers)
    replay = _expect(replayed, 200, "reintento")
    if replay != first or replayed.headers.get("Idempotency-Replayed") != "true":
        raise SmokeError("el reintento no fue idempotente")
    _ok(
        "intento calificado",
        f"correcto={first['isCorrect']} · puntos={first['pointsAwarded']} "
        f"· racha={first['streak']}",
    )
    _ok("reintento con la misma clave devolvió el mismo resultado")

    print("9. Progreso")
    progress = _expect(
        client.get(f"/v1/perfiles/{child_id}/progreso", headers=headers), 200, "progreso"
    )
    if progress["score"] != first["pointsAwarded"] or progress["totalAttempts"] != 1:
        raise SmokeError("el progreso no coincide con el intento")
    _ok(
        "progreso autoritativo",
        f"puntos {progress['score']} · dificultad {progress['currentDifficulty']}",
    )

    print("10. Estafador curado")
    if first["allowsConversation"]:
        reply = _expect(
            client.post(
                "/v1/conversaciones/respuestas",
                json={
                    "challengeId": challenge_id,
                    "historial": [{"autor": "nino", "texto": "no te doy mi clave"}],
                },
                headers=headers,
            ),
            200,
            "respuesta del estafador",
        )
        _ok("respuesta curada", f"origen {reply['origen']}: “{reply['texto']}”")
    else:
        _expect(
            client.post(
                "/v1/conversaciones/respuestas",
                json={
                    "challengeId": challenge_id,
                    "historial": [{"autor": "nino", "texto": "hola"}],
                },
                headers=headers,
            ),
            409,
            "conversación no permitida",
        )
        _ok("el escenario legítimo no admite conversación (409)")

    print("11. Aislamiento entre adultos")
    intruder_headers = identities.new_adult()
    _expect(
        client.post(
            "/v1/cuenta",
            json={"ageGateRuleVersion": AGE_GATE_RULE_VERSION},
            headers=intruder_headers,
        ),
        200,
        "cuenta del intruso",
    )
    _expect(client.get(f"/v1/perfiles/{child_id}", headers=intruder_headers), 404, "IDOR de perfil")
    _ok("otro adulto no ve el perfil ajeno (404)")

    print("12. Borrado")
    for label, adult_headers in (("intruso", intruder_headers), ("adulto", headers)):
        _expect(
            client.delete(
                "/v1/me",
                headers={**adult_headers, "Idempotency-Key": f"borrado-{secrets.token_hex(4)}"},
            ),
            204,
            f"borrar cuenta del {label}",
        )
    _expect(client.get("/v1/me", headers=headers), 404, "cuenta tras borrado")
    _ok("cuenta y datos borrados")
