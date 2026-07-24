from __future__ import annotations

import ast
from pathlib import Path

FORBIDDEN_IMPORTS = {
    "aws_lambda_powertools",
    "boto3",
    "botocore",
    "fastapi",
    "pydantic",
}


def _import_roots(path: Path) -> set[str]:
    tree = ast.parse(path.read_text(encoding="utf-8"))
    imports: set[str] = set()

    for node in ast.walk(tree):
        if isinstance(node, ast.Import):
            imports.update(alias.name.split(".")[0] for alias in node.names)
        if isinstance(node, ast.ImportFrom) and node.module:
            imports.add(node.module.split(".")[0])

    return imports


def test_domain_and_application_do_not_depend_on_framework_or_aws_sdk() -> None:
    source_root = Path(__file__).parents[2] / "src" / "ponte_trucha"

    for layer in ("domain", "application"):
        layer_path = source_root / layer
        assert layer_path.is_dir(), f"Falta la capa {layer}."

        for source_file in layer_path.rglob("*.py"):
            assert not (_import_roots(source_file) & FORBIDDEN_IMPORTS), source_file
