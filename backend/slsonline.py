import json
import os
import re

from logger import logger
from ruamel.yaml import YAML
from ruamel.yaml.comments import CommentedMap
from ruamel.yaml.scalarstring import DoubleQuotedScalarString




def _get_slssteam_config_path() -> str:
    return os.path.expanduser("~/.config/SLSsteam/config.yaml")


def _update_fake_app_ids(content: str, fake_app_ids: dict) -> str:
    lines = content.split('\n')
    result = []
    i = 0

    while i < len(lines):
        line = lines[i]

        if line.strip().startswith('FakeAppIds:'):
            result.append(line)
            i += 1

            while i < len(lines):
                current = lines[i]
                indent = len(current) - len(current.lstrip())

                if current.strip() == '':
                    result.append(current)
                    i += 1
                    continue

                indent_current = len(current) - len(current.lstrip())
                if indent_current <= 0:
                    break

                if re.match(r'^\s*\d+:\s*\d+', current):
                    i += 1
                    continue

                result.append(current)
                i += 1

            for appid, steamid in fake_app_ids.items():
                result.append(' ' * 2 + f"{appid}: {steamid}")
        else:
            result.append(line)
            i += 1

    return '\n'.join(result)


def _update_status_section(content: str, section_name: str, updates: dict) -> str:
    lines = content.split('\n')
    result = []
    i = 0

    while i < len(lines):
        line = lines[i]

        if line.strip().startswith(f'{section_name}:'):
            result.append(line)
            i += 1

            section_indent = len(line) - len(line.lstrip())
            found_appid = False
            found_title = False

            while i < len(lines):
                current = lines[i]
                indent = len(current) - len(current.lstrip())

                if current.strip() == '':
                    result.append(current)
                    i += 1
                    continue

                if indent <= section_indent:
                    break

                if 'AppId:' in current:
                    found_appid = True
                    if 'AppId' in updates:
                        appid_value = updates['AppId']
                        result.append(' ' * (section_indent + 2) + f"AppId: {appid_value}")
                    i += 1
                elif 'Title:' in current:
                    found_title = True
                    if 'Title' in updates:
                        title_value = updates['Title']
                        if '"' not in str(title_value) and "'" not in str(title_value):
                            title_value = f'"{title_value}"'
                        result.append(' ' * (section_indent + 2) + f"Title: {title_value}")
                    i += 1
                else:
                    result.append(current)
                    i += 1

            if not found_appid and 'AppId' in updates:
                result.append(' ' * (section_indent + 2) + f"AppId: {updates['AppId']}")
            if not found_title and 'Title' in updates:
                title_value = updates['Title']
                if '"' not in str(title_value) and "'" not in str(title_value):
                    title_value = f'"{title_value}"'
                result.append(' ' * (section_indent + 2) + f"Title: {title_value}")
        else:
            result.append(line)
            i += 1

    return '\n'.join(result)




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

        with open(config_path, "r") as f:
            content = f.read()

        yaml = YAML()
        yaml.preserve_quotes = True
        yaml.width = 4096

        config = yaml.load(content)
        fake_app_ids = config.get("FakeAppIds") or {}

        if appid in fake_app_ids:
            del fake_app_ids[appid]
            action = "removed"
        else:
            fake_app_ids[appid] = 480
            action = "added"

        updated_content = _update_fake_app_ids(content, fake_app_ids)

        with open(config_path, "w") as f:
            f.write(updated_content)

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

        with open(config_path, "r") as f:
            content = f.read()

        updated_content = _update_status_section(content, "IdleStatus", {
            "AppId": idle_appid,
            "Title": idle_title
        })

        updated_content = _update_status_section(updated_content, "UnownedStatus", {
            "AppId": unowned_appid,
            "Title": unowned_title
        })

        with open(config_path, "w") as f:
            f.write(updated_content)

        logger.log("Status config saved")
        return json.dumps({"success": True})
    except Exception as exc:
        logger.error(f"Error saving status config: {exc}")
        return json.dumps({"success": False, "error": str(exc)})
