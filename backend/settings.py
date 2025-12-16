import json
import os
import shutil
from typing import Any, Dict

from config import SETTINGS_JSON_FILE
from logger import logger as shared_logger
from paths import backend_path
from utils import read_json

logger = shared_logger

# Configuration version for migrations
SETTINGS_VERSION = 1


def get_template_settings() -> Dict[str, Any]:
    """Returns the default settings from template file."""
    template_path = backend_path("settings.template.json")

    if os.path.exists(template_path):
        try:
            template_settings = read_json(template_path)
            if isinstance(template_settings, dict):
                # Ensure template has required fields
                if "api_list" not in template_settings:
                    template_settings["api_list"] = []
                if "accela_location" not in template_settings:
                    template_settings["accela_location"] = ""
                return template_settings
        except Exception as exc:
            logger.warn(f"Failed to load template: {exc}")

    # Fallback to hardcoded defaults if template doesn't exist
    return {
        "api_list": [
            {
                "name": "Morrenus",
                "url": "https://manifest.morrenus.xyz/api/v1/manifest/<appid>",
                "api_key": "",
                "enabled": True
            }
        ],
        "accela_location": ""
    }


def get_default_settings() -> Dict[str, Any]:
    """Returns the default settings structure with version."""
    return {
        "version": SETTINGS_VERSION,
        "api_list": [],
        "accela_location": ""
    }


def migrate_settings(settings: Dict[str, Any]) -> Dict[str, Any]:
    """Migrates settings to the latest version."""
    if not isinstance(settings, dict):
        return get_default_settings()

    current_version = settings.get("version", 0)

    # Add version field if missing
    if current_version < SETTINGS_VERSION:
        logger.log(f"Migrating settings from version {current_version} to {SETTINGS_VERSION}")
        settings["version"] = SETTINGS_VERSION
        current_version = SETTINGS_VERSION

    # Future migration logic can go here
    # Example:
    # if current_version < 2:
    #     # Migrate to version 2
    #     settings["new_field"] = "default_value"
    #     settings["version"] = 2

    return settings


def load_settings() -> Dict[str, Any]:
    """Loads settings from settings.json, preserving user customizations."""
    settings_path = backend_path(SETTINGS_JSON_FILE)

    if not os.path.exists(settings_path):
        logger.log("settings.json not found, creating from template")
        settings = get_template_settings()
        settings["version"] = SETTINGS_VERSION
        save_settings(settings)
        return settings

    try:
        settings = read_json(settings_path)
        if not isinstance(settings, dict):
            logger.warn("settings.json has invalid format, preserving backup and recreating from template")
            # Backup corrupted file
            backup_path = backend_path(f"settings.json.backup")
            try:
                shutil.copy2(settings_path, backup_path)
                logger.log(f"Corrupted settings backed up to {backup_path}")
            except Exception as exc:
                logger.warn(f"Failed to backup corrupted settings: {exc}")

            # Recreate from template
            settings = get_template_settings()
            settings["version"] = SETTINGS_VERSION
            save_settings(settings)
            return settings

        # Migrate settings to current version
        settings = migrate_settings(settings)

        # Ensure all required fields exist (backward compatibility)
        if "api_list" not in settings:
            settings["api_list"] = []
        if "accela_location" not in settings:
            settings["accela_location"] = ""

        logger.log("Settings loaded successfully")
        return settings
    except Exception as exc:
        logger.error(f"Error loading settings.json: {exc}")
        logger.log("Loading default settings")
        settings = get_template_settings()
        settings["version"] = SETTINGS_VERSION
        save_settings(settings)
        return settings


def save_settings(settings: Dict[str, Any]) -> bool:
    """Saves settings to settings.json."""
    settings_path = backend_path(SETTINGS_JSON_FILE)

    try:
        # Validate structure
        if not isinstance(settings, dict):
            raise ValueError("Settings must be a dictionary")

        # Ensure version field is present
        if "version" not in settings:
            settings["version"] = SETTINGS_VERSION

        # Ensure all required fields exist
        if "api_list" not in settings:
            settings["api_list"] = []
        if "accela_location" not in settings:
            settings["accela_location"] = ""

        # Write file with pretty formatting
        with open(settings_path, "w", encoding="utf-8") as f:
            json.dump(settings, f, indent=2, ensure_ascii=False)

        logger.log(f"Settings saved to {settings_path}")
        return True
    except Exception as exc:
        logger.error(f"Error saving settings.json: {exc}")
        return False
