import json
import os
import shutil
import sys
import webbrowser

import Millennium  # type: ignore
from config import WEB_UI_JS_FILE, WEBKIT_DIR_NAME
from downloads import cancel_add_via_cyberia, get_add_status, start_add_via_cyberia
from http_client import close_http_client
from logger import logger as shared_logger
from paths import get_plugin_dir, public_path
from settings import load_settings, save_settings
from slsonline import (
    check_fake_app_id,
    toggle_fake_app_id,
    get_status_config,
    save_status_config,
)
from utils import ensure_temp_download_dir

logger = shared_logger


def GetPluginDir() -> str:  # Legacy API used by the frontend
    return get_plugin_dir()


class Logger:
    @staticmethod
    def log(message: str) -> str:
        shared_logger.log(f"[Frontend] {message}")
        return json.dumps({"success": True})

    @staticmethod
    def warn(message: str) -> str:
        shared_logger.warn(f"[Frontend] {message}")
        return json.dumps({"success": True})

    @staticmethod
    def error(message: str) -> str:
        shared_logger.error(f"[Frontend] {message}")
        return json.dumps({"success": True})


def _steam_ui_path() -> str:
    return os.path.join(Millennium.steam_path(), "steamui", WEBKIT_DIR_NAME)


def _copy_webkit_files() -> None:
    steam_ui_path = _steam_ui_path()
    os.makedirs(steam_ui_path, exist_ok=True)

    js_src = public_path(WEB_UI_JS_FILE)
    js_dst = os.path.join(steam_ui_path, WEB_UI_JS_FILE)
    logger.log(f"Copying Cyberia web UI from {js_src} to {js_dst}")
    try:
        shutil.copy(js_src, js_dst)
    except Exception as exc:
        logger.error(f"Failed to copy Cyberia web UI: {exc}")


def _inject_webkit_files() -> None:
    js_path = os.path.join(WEBKIT_DIR_NAME, WEB_UI_JS_FILE)
    Millennium.add_browser_js(js_path)
    logger.log(f"Cyberia injected web UI: {js_path}")


def StartAddViaCyberia(appid: int, contentScriptQuery: str = "") -> str:
    return start_add_via_cyberia(appid)


def GetAddViaCyberiaStatus(appid: int, contentScriptQuery: str = "") -> str:
    return get_add_status(appid)


def CancelAddViaCyberia(appid: int, contentScriptQuery: str = "") -> str:
    return cancel_add_via_cyberia(appid)


def OpenExternalUrl(url: str, contentScriptQuery: str = "") -> str:
    try:
        value = str(url or "").strip()
        if not (value.startswith("http://") or value.startswith("https://")):
            return json.dumps({"success": False, "error": "Invalid URL"})
        if sys.platform.startswith("win"):
            try:
                os.startfile(value)  # type: ignore[attr-defined]
            except Exception:
                webbrowser.open(value)
        else:
            webbrowser.open(value)
        return json.dumps({"success": True})
    except Exception as exc:
        logger.warn(f"Cyberia: OpenExternalUrl failed: {exc}")
        return json.dumps({"success": False, "error": str(exc)})


def GetSettings(contentScriptQuery: str = "") -> str:
    """Returns current settings as JSON."""
    try:
        settings = load_settings()
        return json.dumps({"success": True, "settings": settings})
    except Exception as exc:
        logger.error(f"Error loading settings: {exc}")
        return json.dumps({"success": False, "error": str(exc)})


def SaveSettings(settings_json: str, contentScriptQuery: str = "") -> str:
    """Saves settings sent by the frontend."""
    try:
        settings_data = json.loads(settings_json)

        if not isinstance(settings_data, dict):
            return json.dumps({"success": False, "error": "Invalid settings"})

        # Validate basic structure
        if "api_list" not in settings_data:
            settings_data["api_list"] = []
        if "accela_location" not in settings_data:
            settings_data["accela_location"] = ""

        # Save settings
        success = save_settings(settings_data)

        if success:
            logger.log("Settings saved successfully")
            return json.dumps({"success": True})
        else:
            return json.dumps(
                {"success": False, "error": "Failed to save settings"}
            )
    except json.JSONDecodeError as exc:
        logger.error(f"Error decoding JSON: {exc}")
        return json.dumps({"success": False, "error": "Invalid JSON"})
    except Exception as exc:
        logger.error(f"Error saving settings: {exc}")
        return json.dumps({"success": False, "error": str(exc)})


def CheckFakeAppId(appid: int, contentScriptQuery: str = "") -> str:
    return check_fake_app_id(appid)


def ToggleFakeAppId(appid: int, contentScriptQuery: str = "") -> str:
    return toggle_fake_app_id(appid)


def GetStatusConfig(contentScriptQuery: str = "") -> str:
    return get_status_config()


def SaveStatusConfig(
    idle_appid: int,
    idle_title: str,
    unowned_appid: int,
    unowned_title: str,
    contentScriptQuery: str = "",
) -> str:
    return save_status_config(idle_appid, idle_title, unowned_appid, unowned_title)


class Plugin:
    def _front_end_loaded(self):
        _copy_webkit_files()

    def _load(self):
        logger.log(f"bootstrapping Cyberia plugin, millennium {Millennium.version()}")

        ensure_temp_download_dir()

        _copy_webkit_files()
        _inject_webkit_files()

        Millennium.ready()

    def _unload(self):
        logger.log("unloading")
        close_http_client("InitApis")


plugin = Plugin()
