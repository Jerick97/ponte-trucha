"""Gestiona cuentas adultas en el User Pool emulado (Floci).

El emulador no entrega el correo de verificación, así que estas dos operaciones
reemplazan ese paso **solo en local**. En AWS real el adulto recibe el código en
su correo y confirma desde el navegador, sin intervención de nadie.

    # crear una cuenta lista para entrar desde el navegador
    backend/.venv/bin/python backend/scripts/cuenta_floci.py \
        crear papa@ejemplo.local 'Trucha-Local-2026!'

    # confirmar una cuenta que se registró desde el navegador
    backend/.venv/bin/python backend/scripts/cuenta_floci.py confirmar papa@ejemplo.local
"""

from __future__ import annotations

import sys

from floci_cognito import confirm_adult, create_confirmed_adult, discover_deployment

USAGE = "Uso: cuenta_floci.py crear <correo> [clave] | confirmar <correo>"


def main(argv: list[str]) -> int:
    if len(argv) < 2:
        print(USAGE, file=sys.stderr)
        return 2

    accion, email, *resto = argv
    deployment = discover_deployment()

    if accion == "crear":
        password = resto[0] if resto else None
        correo, clave = create_confirmed_adult(deployment, email=email, password=password)
        print(f"Cuenta lista en {deployment.user_pool_id}")
        print(f"  correo: {correo}")
        print(f"  clave:  {clave}")
        print("Entra con «Ya tengo cuenta» en el onboarding.")
        return 0

    if accion == "confirmar":
        confirm_adult(deployment, email=email)
        print(f"Cuenta {email} confirmada. Ya puede iniciar sesión.")
        return 0

    print(USAGE, file=sys.stderr)
    return 2


if __name__ == "__main__":
    try:
        raise SystemExit(main(sys.argv[1:]))
    except RuntimeError as error:
        print(f"FALLÓ: {error}", file=sys.stderr)
        raise SystemExit(1) from error
