"""Catálogo de apps/canales soportados y su registro de factories.

`ScenarioFactoryRegistry` es la única fuente de verdad de qué canales existen.
El catálogo público (`GET /v1/apps`) se deriva de `list_channels()`, que solo
expone metadata de interfaz (tipo, nombre visible, ícono) y nunca contenido de
escenario, señales delatoras ni respuestas correctas.

Sin dependencias externas (ni FastAPI, ni pydantic, ni boto3): esta capa es
dominio puro, tal como exige la regla de dependencias del steering.
"""

from __future__ import annotations

from dataclasses import dataclass
from enum import StrEnum
from typing import Protocol


class AppType(StrEnum):
    """Canales/apps simulados dentro del teléfono del juego."""

    WHATSAPP = "whatsapp"
    SMS = "sms"
    EMAIL = "email"
    ROBLOX = "roblox"
    DISCORD = "discord"


@dataclass(frozen=True, slots=True)
class ChannelInfo:
    """Metadata pública de un canal, sin contenido de escenario."""

    app_type: AppType
    display_name: str
    icon_key: str


class ScenarioFactory(Protocol):
    """Contrato de una factory de escenarios para un canal específico."""

    def channel_info(self) -> ChannelInfo: ...


# Prioridad de producto: orden en el que el catálogo se muestra en la UI.
_DEFAULT_PRIORITY: tuple[AppType, ...] = (
    AppType.WHATSAPP,
    AppType.SMS,
    AppType.EMAIL,
    AppType.ROBLOX,
    AppType.DISCORD,
)

_DEFAULT_CHANNEL_INFO: dict[AppType, ChannelInfo] = {
    AppType.WHATSAPP: ChannelInfo(AppType.WHATSAPP, "WhatsApp", "channel-whatsapp"),
    AppType.SMS: ChannelInfo(AppType.SMS, "Mensajes", "channel-sms"),
    AppType.EMAIL: ChannelInfo(AppType.EMAIL, "Correo", "channel-email"),
    AppType.ROBLOX: ChannelInfo(AppType.ROBLOX, "Roblox", "channel-roblox"),
    AppType.DISCORD: ChannelInfo(AppType.DISCORD, "Discord", "channel-discord"),
}


@dataclass(frozen=True, slots=True)
class _StaticScenarioFactory:
    """Factory mínima que solo declara su metadata de catálogo.

    Las tareas 9-10 (Fase 2) reemplazan/extienden esto con la construcción real
    del payload por canal; este tipo cubre lo que 10.1 necesita hoy: metadata
    de catálogo sin instanciar ningún reto.
    """

    _info: ChannelInfo

    def channel_info(self) -> ChannelInfo:
        return self._info


@dataclass(frozen=True, slots=True)
class ScenarioFactoryRegistry:
    """Resuelve la factory de un canal y expone metadata de catálogo."""

    entries: dict[AppType, ScenarioFactory]
    priority: tuple[AppType, ...] = ()

    @classmethod
    def with_default_channels(cls) -> ScenarioFactoryRegistry:
        entries: dict[AppType, ScenarioFactory] = {
            app_type: _StaticScenarioFactory(info)
            for app_type, info in _DEFAULT_CHANNEL_INFO.items()
        }
        return cls(entries=entries, priority=_DEFAULT_PRIORITY)

    def factory_for(self, app_type: AppType) -> ScenarioFactory:
        try:
            return self.entries[app_type]
        except KeyError as error:
            raise KeyError(f"No hay factory registrada para {app_type!r}") from error

    def list_channels(self) -> tuple[ChannelInfo, ...]:
        """Metadata pública de cada canal registrado, en orden de prioridad.

        No instancia ningún reto ni toca el banco de escenarios: es una lectura
        de solo metadata, segura para exponer sin autenticación.
        """
        order = self.priority or tuple(self.entries.keys())
        return tuple(
            self.entries[app_type].channel_info() for app_type in order if app_type in self.entries
        )
