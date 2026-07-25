from __future__ import annotations

import pytest

from ponte_trucha.domain.channels import AppType, ScenarioFactoryRegistry


def test_registry_lists_every_registered_channel_with_display_metadata_only() -> None:
    registry = ScenarioFactoryRegistry.with_default_channels()

    channels = registry.list_channels()

    assert {entry.app_type for entry in channels} == {
        AppType.ROBLOX,
        AppType.SMS,
        AppType.EMAIL,
        AppType.WHATSAPP,
    }
    for entry in channels:
        assert entry.display_name
        assert entry.icon_key
        assert not hasattr(entry, "scenario_id")
        assert not hasattr(entry, "grading")


def test_registry_exposes_channels_in_declared_priority_order() -> None:
    registry = ScenarioFactoryRegistry.with_default_channels()

    ordered_types = [entry.app_type for entry in registry.list_channels()]

    assert ordered_types == [
        AppType.WHATSAPP,
        AppType.SMS,
        AppType.EMAIL,
        AppType.ROBLOX,
    ]


def test_registry_raises_when_a_channel_has_no_factory_registered() -> None:
    registry = ScenarioFactoryRegistry(entries={})

    with pytest.raises(KeyError):
        registry.factory_for(AppType.SMS)
