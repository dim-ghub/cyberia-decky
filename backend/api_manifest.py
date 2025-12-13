"""Management of the Cyberia API manifest (free API list)."""

from __future__ import annotations

import json
from typing import Any, Dict, List

from config import SETTINGS_JSON_FILE
from logger import logger
from utils import (
    backend_path,
    normalize_manifest_text,
    read_text,
    write_text,
)


def load_api_manifest() -> List[Dict[str, Any]]:
    """Return the list of enabled APIs from settings.json."""
    path = backend_path(SETTINGS_JSON_FILE)
    text = read_text(path)
    normalized = normalize_manifest_text(text)
    if normalized and normalized != text:
        try:
            write_text(path, normalized)
            logger.log("Cyberia: Normalized settings.json to valid JSON")
        except Exception:
            pass
        text = normalized

    try:
        data = json.loads(text or "{}")
        apis = data.get("api_list", [])
        return [api for api in apis if api.get("enabled", False)]
    except Exception as exc:
        logger.error(f"Cyberia: Failed to parse settings.json: {exc}")
        return []
