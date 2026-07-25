import re
from pathlib import Path

from ponte_trucha.entrypoints.http.api_ia_app import create_ia_app
from ponte_trucha.entrypoints.http.app import create_app

INFRASTRUCTURE_ROUTE_PATTERN = re.compile(r'route_key\s*=\s*"([A-Z]+) ([^"]+)"')


def test_api_gateway_only_publishes_routes_implemented_by_fastapi() -> None:
    terraform_path = Path(__file__).parents[3] / "infra/modules/api/main.tf"
    published_routes = set(INFRASTRUCTURE_ROUTE_PATTERN.findall(terraform_path.read_text()))
    openapi_paths = {
        **create_app().openapi()["paths"],
        **create_ia_app().openapi()["paths"],
    }
    implemented_routes = {
        (method.upper(), path)
        for path, operations in openapi_paths.items()
        for method in operations
        if method in {"delete", "get", "patch", "post", "put"}
    }

    assert published_routes == implemented_routes
