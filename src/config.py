from pathlib import Path
from typing import Any, Dict

import yaml

PROJECT_ROOT = Path(__file__).resolve().parent.parent
CONFIG_DIR = PROJECT_ROOT / "config"
DATA_DIR = PROJECT_ROOT / "data"


def load_yaml(name: str) -> Dict[str, Any]:
    path = CONFIG_DIR / name
    with open(path, "r", encoding="utf-8") as f:
        return yaml.safe_load(f) or {}


def load_sources() -> Dict[str, Any]:
    return load_yaml("sources.yaml")


def load_jgrants_field_map() -> Dict[str, list]:
    return load_yaml("jgrants_fields.yaml")
