import json
import os

from logger import logger
from ruamel.yaml import YAML
from ruamel.yaml.comments import CommentedMap
from ruamel.yaml.scalarstring import DoubleQuotedScalarString


def _get_slssteam_config_path() -> str:
    return os.path.expanduser("~/.config/SLSsteam/config.yaml")


def check_fake_app_id(appid: int) -> str:
    try:
        config_path = _get_slssteam_config_path()
        if not os.path.exists(config_path):
            return json.dumps({"success": True, "exists": False})

        yaml = YAML()
        yaml.preserve_quotes = True
        yaml.width = 4096

        with open(config_path, "r") as f:
            config = yaml.load(f)

        fake_app_ids = config.get("FakeAppIds") or {}
        exists = appid in fake_app_ids
        return json.dumps({"success": True, "exists": exists})
    except Exception as exc:
        logger.error(f"Error checking FakeAppId: {exc}")
        return json.dumps({"success": False, "error": str(exc)})


def toggle_fake_app_id(appid: int) -> str:
    try:
        config_path = _get_slssteam_config_path()
        if not os.path.exists(config_path):
            return json.dumps({"success": False, "error": "Config file not found"})

        yaml = YAML()
        yaml.preserve_quotes = True
        yaml.width = 4096

        with open(config_path, "r") as f:
            config = yaml.load(f)

        fake_app_ids = config.get("FakeAppIds") or CommentedMap()

        if appid in fake_app_ids:
            del fake_app_ids[appid]
            action = "removed"
        else:
            fake_app_ids[appid] = 480
            action = "added"

        config["FakeAppIds"] = fake_app_ids

        with open(config_path, "w") as f:
            yaml.dump(config, f)

        logger.log(f"FakeAppId {appid} {action}")
        return json.dumps({"success": True, "action": action, "appid": appid})
    except Exception as exc:
        logger.error(f"Error toggling FakeAppId: {exc}")
        return json.dumps({"success": False, "error": str(exc)})


def get_status_config() -> str:
    try:
        config_path = _get_slssteam_config_path()
        if not os.path.exists(config_path):
            return json.dumps(
                {
                    "success": True,
                    "idle_appid": 0,
                    "idle_title": "",
                    "unowned_appid": 0,
                    "unowned_title": "",
                }
            )

        yaml = YAML()
        yaml.preserve_quotes = True
        yaml.width = 4096

        with open(config_path, "r") as f:
            config = yaml.load(f)

        idle_status = config.get("IdleStatus") or {}
        unowned_status = config.get("UnownedStatus") or {}

        return json.dumps(
            {
                "success": True,
                "idle_appid": idle_status.get("AppId", 0),
                "idle_title": idle_status.get("Title", ""),
                "unowned_appid": unowned_status.get("AppId", 0),
                "unowned_title": unowned_status.get("Title", ""),
            }
        )
    except Exception as exc:
        logger.error(f"Error reading status config: {exc}")
        return json.dumps({"success": False, "error": str(exc)})


def save_status_config(
    idle_appid: int, idle_title: str, unowned_appid: int, unowned_title: str
) -> str:
    try:
        config_path = _get_slssteam_config_path()
        if not os.path.exists(config_path):
            return json.dumps({"success": False, "error": "Config file not found"})

        yaml = YAML()
        yaml.preserve_quotes = True
        yaml.width = 4096
        yaml.allow_unicode = True
        yaml.default_flow_style = False

        with open(config_path, "r") as f:
            config = yaml.load(f)

        idle_status = CommentedMap()
        idle_status["AppId"] = idle_appid
        idle_status["Title"] = DoubleQuotedScalarString(idle_title)

        unowned_status = CommentedMap()
        unowned_status["AppId"] = unowned_appid
        unowned_status["Title"] = DoubleQuotedScalarString(unowned_title)

        config["IdleStatus"] = idle_status
        config["UnownedStatus"] = unowned_status

        with open(config_path, "w") as f:
            yaml.dump(config, f)

        logger.log("Status config saved")
        return json.dumps({"success": True})
    except Exception as exc:
        logger.error(f"Error saving status config: {exc}")
        return json.dumps({"success": False, "error": str(exc)})
