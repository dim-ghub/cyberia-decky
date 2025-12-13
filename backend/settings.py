import json
import os
from typing import Any, Dict

from config import SETTINGS_JSON_FILE
from logger import logger as shared_logger
from paths import backend_path
from utils import read_json

logger = shared_logger


def get_default_settings() -> Dict[str, Any]:
    """Returns the default settings structure."""
    return {"api_list": [], "accela_location": ""}


def load_settings() -> Dict[str, Any]:
    """Loads settings from settings.json."""
    settings_path = backend_path(SETTINGS_JSON_FILE)

    if not os.path.exists(settings_path):
        logger.log("settings.json not found, creating with default settings")
        settings = get_default_settings()
        save_settings(settings)
        return settings

    try:
        settings = read_json(settings_path)
        if not isinstance(settings, dict):
            logger.warn("settings.json has invalid format, recreating")
            settings = get_default_settings()
            save_settings(settings)
            return settings

        # Ensure all required fields exist
        if "api_list" not in settings:
            settings["api_list"] = []
        if "accela_location" not in settings:
            settings["accela_location"] = ""

        return settings
    except Exception as exc:
        logger.error(f"Error loading settings.json: {exc}")
        settings = get_default_settings()
        save_settings(settings)
        return settings


def save_settings(settings: Dict[str, Any]) -> bool:
    """Saves settings to settings.json."""
    settings_path = backend_path(SETTINGS_JSON_FILE)

    try:
        # Validate structure
        if not isinstance(settings, dict):
            raise ValueError("Settings must be a dictionary")

        if "api_list" not in settings:
            settings["api_list"] = []
        if "accela_location" not in settings:
            settings["accela_location"] = ""

        # Write file
        with open(settings_path, "w", encoding="utf-8") as f:
            json.dump(settings, f, indent=2, ensure_ascii=False)

        logger.log(f"Settings saved to {settings_path}")
        return True
    except Exception as exc:
        logger.error(f"Error saving settings.json: {exc}")
        return False
