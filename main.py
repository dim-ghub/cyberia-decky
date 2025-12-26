import json
import os
import sys
import webbrowser
import asyncio
from typing import Any, Dict, Optional

from decky import plugin

# Import existing backend modules
sys.path.append(os.path.join(plugin.PLUGIN_DIR, "backend"))
from downloads import start_add_via_cyberia, get_add_status, cancel_add_via_cyberia
from settings import load_settings, save_settings
from slsonline import (
    check_fake_app_id,
    toggle_fake_app_id,
    get_status_config,
    save_status_config,
)
from http_client import close_http_client
from logger import logger as shared_logger

logger = shared_logger


class Plugin:
    async def _main(self):
        """Main entry point for the plugin."""
        logger.log(f"Cyberia plugin starting for Decky Loader")

        # Initialize temp directories and other setup
        try:
            from utils import ensure_temp_download_dir

            ensure_temp_download_dir()
        except Exception as e:
            logger.error(f"Failed to initialize temp directories: {e}")

    async def _unload(self):
        """Cleanup when plugin is unloaded."""
        logger.log("Cyberia plugin unloading")
        try:
            close_http_client("InitApis")
        except Exception as e:
            logger.error(f"Error during cleanup: {e}")

    async def call_method(self, method_name: str, *args, **kwargs):
        """Main method dispatcher for frontend-backend communication."""
        try:
            if method_name == "start_add_via_cyberia":
                appid = args[0] if args else kwargs.get("appid")
                return start_add_via_cyberia(appid)

            elif method_name == "get_add_status":
                appid = args[0] if args else kwargs.get("appid")
                return get_add_status(appid)

            elif method_name == "cancel_add_via_cyberia":
                appid = args[0] if args else kwargs.get("appid")
                return cancel_add_via_cyberia(appid)

            elif method_name == "get_settings":
                settings = load_settings()
                return json.dumps({"success": True, "settings": settings})

            elif method_name == "save_settings":
                settings_json = args[0] if args else kwargs.get("settings_json")
                try:
                    settings_data = json.loads(settings_json)
                    if not isinstance(settings_data, dict):
                        return json.dumps(
                            {"success": False, "error": "Invalid settings"}
                        )

                    # Validate basic structure
                    if "api_list" not in settings_data:
                        settings_data["api_list"] = []
                    if "accela_location" not in settings_data:
                        settings_data["accela_location"] = ""

                    success = save_settings(settings_data)
                    if success:
                        logger.log("Settings saved successfully")
                        return json.dumps({"success": True})
                    else:
                        return json.dumps(
                            {"success": False, "error": "Failed to save settings"}
                        )
                except json.JSONDecodeError as e:
                    logger.error(f"Error decoding JSON: {e}")
                    return json.dumps({"success": False, "error": "Invalid JSON"})
                except Exception as e:
                    logger.error(f"Error saving settings: {e}")
                    return json.dumps({"success": False, "error": str(e)})

            elif method_name == "open_external_url":
                url = args[0] if args else kwargs.get("url")
                try:
                    value = str(url or "").strip()
                    if not (
                        value.startswith("http://") or value.startswith("https://")
                    ):
                        return json.dumps({"success": False, "error": "Invalid URL"})

                    webbrowser.open(value)
                    return json.dumps({"success": True})
                except Exception as e:
                    logger.warn(f"Cyberia: OpenExternalUrl failed: {e}")
                    return json.dumps({"success": False, "error": str(e)})

            elif method_name == "check_fake_app_id":
                appid = args[0] if args else kwargs.get("appid")
                return check_fake_app_id(appid)

            elif method_name == "toggle_fake_app_id":
                appid = args[0] if args else kwargs.get("appid")
                return toggle_fake_app_id(appid)

            elif method_name == "get_status_config":
                return get_status_config()

            elif method_name == "save_status_config":
                idle_appid = args[0] if args else kwargs.get("idle_appid")
                idle_title = args[1] if len(args) > 1 else kwargs.get("idle_title")
                unowned_appid = (
                    args[2] if len(args) > 2 else kwargs.get("unowned_appid")
                )
                unowned_title = (
                    args[3] if len(args) > 3 else kwargs.get("unowned_title")
                )
                return save_status_config(
                    idle_appid, idle_title, unowned_appid, unowned_title
                )

            elif method_name == "log":
                message = args[0] if args else kwargs.get("message", "")
                logger.log(f"[Frontend] {message}")
                return json.dumps({"success": True})

            elif method_name == "warn":
                message = args[0] if args else kwargs.get("message", "")
                logger.warn(f"[Frontend] {message}")
                return json.dumps({"success": True})

            elif method_name == "error":
                message = args[0] if args else kwargs.get("message", "")
                logger.error(f"[Frontend] {message}")
                return json.dumps({"success": True})

            else:
                logger.warn(f"Unknown method called: {method_name}")
                return json.dumps(
                    {"success": False, "error": f"Unknown method: {method_name}"}
                )

        except Exception as e:
            logger.error(f"Error in method {method_name}: {e}")
            return json.dumps({"success": False, "error": str(e)})


# Create plugin instance
plugin_instance = Plugin()
