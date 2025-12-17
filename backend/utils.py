"""Generic helpers for file and data handling in the Cyberia backend."""

from __future__ import annotations

import json
import os
import re
from typing import Any, Dict

from paths import backend_path


def read_text(path: str) -> str:
    try:
        with open(path, "r", encoding="utf-8") as handle:
            return handle.read()
    except Exception:
        return ""


def write_text(path: str, text: str) -> None:
    with open(path, "w", encoding="utf-8") as handle:
        handle.write(text)


def read_json(path: str) -> Dict[str, Any]:
    try:
        with open(path, "r", encoding="utf-8") as handle:
            return json.load(handle)
    except Exception:
        return {}


def normalize_manifest_text(text: str) -> str:
    content = (text or "").strip()
    if not content:
        return content

    content = re.sub(r",\s*]", "]", content)
    content = re.sub(r",\s*}\s*$", "}", content)

    if (
        content.startswith('"api_list"')
        or content.startswith("'api_list'")
        or content.startswith("api_list")
    ):
        if not content.startswith("{"):
            content = "{" + content
        if not content.endswith("}"):
            content = content.rstrip(",") + "}"

    try:
        json.loads(content)
        return content
    except Exception:
        return text


def ensure_temp_download_dir() -> str:
    root = backend_path("temp_dl")
    try:
        os.makedirs(root, exist_ok=True)
    except Exception:
        pass
    return root


def get_accela_api_key() -> str:
    """
    Attempts to read the Morrenus API key from ACCELA's QSettings.
    Returns empty string if PyQt6 is not available or key is not found.
    """
    try:
        from PyQt6.QtCore import QSettings

        APP_NAME = "ACCELA"
        ORG_NAME = "Tachibana Labs"

        settings = QSettings(ORG_NAME, APP_NAME)

        # Try common key names for the Morrenus API key
        possible_keys = ["morrenus_api_key"]

        # First, try the common keys
        for key in possible_keys:
            value = settings.value(key)
            if value:
                return str(value)

        # If not found, search for any key containing "morrenus" in its name
        all_keys = settings.allKeys()
        for key in all_keys:
            if "morrenus" in key.lower():
                value = settings.value(key)
                if value:
                    return str(value)

        return ""
    except ImportError:
        # PyQt6 not available
        return ""
    except Exception:
        # Any other error reading settings
        return ""


__all__ = [
    "ensure_temp_download_dir",
    "get_accela_api_key",
    "normalize_manifest_text",
    "read_json",
    "read_text",
    "write_text",
]
