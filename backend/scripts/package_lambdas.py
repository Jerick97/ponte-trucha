from __future__ import annotations

import shutil
import subprocess
import sys
import tempfile
import zipfile
from pathlib import Path

BACKEND_ROOT = Path(__file__).parents[1]
ARTIFACT_ROOT = BACKEND_ROOT.parents[0] / "infra" / ".artifacts"
RUNTIME_REQUIREMENTS = BACKEND_ROOT / "requirements-runtime.txt"
SOURCE_ROOT = BACKEND_ROOT / "src"
LAMBDA_ROOT = BACKEND_ROOT / "lambda"


def _add_tree(archive: zipfile.ZipFile, root: Path) -> None:
    for path in root.rglob("*"):
        if not path.is_file() or "__pycache__" in path.parts:
            continue
        relative_path = path.relative_to(root).as_posix()
        info = zipfile.ZipInfo(relative_path)
        info.external_attr = 0o755 << 16 if path.suffix == ".sh" else 0o644 << 16
        archive.writestr(info, path.read_bytes(), compress_type=zipfile.ZIP_DEFLATED)


def _build_lambda(lambda_name: str) -> Path:
    artifact_path = ARTIFACT_ROOT / f"{lambda_name}.zip"
    script_path = LAMBDA_ROOT / lambda_name / "run.sh"

    with tempfile.TemporaryDirectory() as temporary_directory:
        staging_root = Path(temporary_directory)
        subprocess.run(
            [
                sys.executable,
                "-m",
                "pip",
                "install",
                "--disable-pip-version-check",
                "--implementation",
                "cp",
                "--no-compile",
                "--only-binary=:all:",
                "--platform",
                "manylinux2014_aarch64",
                "--python-version",
                "3.14",
                "--requirement",
                str(RUNTIME_REQUIREMENTS),
                "--target",
                str(staging_root),
            ],
            check=True,
        )
        shutil.copytree(SOURCE_ROOT / "ponte_trucha", staging_root / "ponte_trucha")
        shutil.copy2(script_path, staging_root / "run.sh")

        ARTIFACT_ROOT.mkdir(parents=True, exist_ok=True)
        with zipfile.ZipFile(artifact_path, "w") as archive:
            _add_tree(archive, staging_root)

    return artifact_path


def main() -> None:
    for lambda_name in ("api-core", "api-ia"):
        print(_build_lambda(lambda_name))


if __name__ == "__main__":
    main()
