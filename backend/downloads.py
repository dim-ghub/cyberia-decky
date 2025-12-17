"""Handling of Cyberia add/download flows and related utilities."""

from __future__ import annotations

import json
import os
import platform
import shutil
import subprocess
import threading
import time
from typing import Dict

from api_manifest import load_api_manifest
from config import USER_AGENT
from http_client import ensure_http_client
from logger import logger
from utils import ensure_temp_download_dir

DOWNLOAD_STATE: Dict[int, Dict[str, any]] = {}
DOWNLOAD_LOCK = threading.Lock()


def _find_accela_executable():
    """Find ACCELA executable using configuration or search strategies."""
    # First, try to read accela_location from settings.json
    settings_path = os.path.join(os.path.dirname(__file__), "settings.json")
    if os.path.exists(settings_path):
        try:
            with open(settings_path, "r", encoding="utf-8") as f:
                settings = json.load(f)
                accela_path = settings.get("accela_location")
                if accela_path:
                    accela_path = accela_path.strip()
                    if accela_path and os.path.exists(accela_path):
                        logger.log(f"Cyberia: Using ACCELA from settings.json: {accela_path}")
                        return accela_path
                    elif accela_path:
                        logger.warn(f"Cyberia: ACCELA path in settings.json not found: {accela_path}")
        except Exception as e:
            logger.warn(f"Failed to load settings.json: {e}")

    # Fallback to platform-specific search
    system = platform.system()

    if system == "Windows":
        # Try PATH first
        accela_path = shutil.which("ACCELA.exe") or shutil.which("ACCELA")
        if accela_path:
            logger.log(f"Cyberia: Found ACCELA in PATH: {accela_path}")
            return accela_path

        # Try common Windows locations
        common_paths = [
            os.path.expandvars(r"%APPDATA%\ACCELA\ACCELA.exe"),
            os.path.expandvars(r"%LOCALAPPDATA%\ACCELA\ACCELA.exe"),
            os.path.expandvars(r"%PROGRAMFILES%\ACCELA\ACCELA.exe"),
            os.path.expandvars(r"%PROGRAMFILES(X86)%\ACCELA\ACCELA.exe"),
            os.path.expanduser(r"~\Desktop\ACCELA.exe"),
            os.path.expanduser(r"~\Documents\ACCELA.exe"),
        ]

        for path in common_paths:
            if os.path.exists(path):
                logger.log(f"Cyberia: Found ACCELA at common location: {path}")
                return path
    else:
        # Linux/Mac behavior
        accela_home = os.path.expanduser("~/.local/share/ACCELA")
        run_sh = os.path.join(accela_home, "run.sh")
        accela_bin = os.path.join(accela_home, "ACCELA")

        if os.path.exists(run_sh):
            logger.log("Cyberia: Found ACCELA run.sh script")
            return run_sh
        elif os.path.exists(accela_bin):
            logger.log("Cyberia: Found ACCELA binary")
            return accela_bin

    return None


def _set_download_state(appid: int, update: dict) -> None:
    with DOWNLOAD_LOCK:
        state = DOWNLOAD_STATE.get(appid) or {}
        state.update(update)
        DOWNLOAD_STATE[appid] = state


def _get_download_state(appid: int) -> dict:
    with DOWNLOAD_LOCK:
        return DOWNLOAD_STATE.get(appid, {}).copy()


def _process_and_install_lua(appid: int, zip_path: str) -> None:
    """Process downloaded zip and call ACCELA app to handle installation."""

    if _is_download_cancelled(appid):
        raise RuntimeError("cancelled")

    _set_download_state(appid, {"status": "installing"})

    accela_path = _find_accela_executable()

    if not accela_path:
        # Provide helpful error message
        settings_path = os.path.join(os.path.dirname(__file__), "settings.json")
        raise RuntimeError(
            f"ACCELA not found. Please set the path in:\n"
            f"{settings_path}\n\n"
            f'Add: {{"accela_location": "C:\\\\path\\\\to\\\\ACCELA.exe"}}'
        )

    # Verify ACCELA is executable
    if not os.access(accela_path, os.X_OK):
        logger.warn(f"Cyberia: ACCELA found but not executable: {accela_path}")
        # Try to make it executable (Linux/Mac)
        try:
            os.chmod(accela_path, 0o755)
            logger.log(f"Cyberia: Made ACCELA executable: {accela_path}")
        except Exception as e:
            logger.warn(f"Cyberia: Failed to make ACCELA executable: {e}")

    # If it's a shell script, ensure it runs with bash
    command = [accela_path, zip_path]
    if accela_path.endswith('.sh'):
        command.insert(0, 'bash')

    try:
        if _is_download_cancelled(appid):
            raise RuntimeError("cancelled")

        logger.log(f"Cyberia: Calling ACCELA with zip: {zip_path}")

        # Create a clean environment without problematic variables
        env = os.environ.copy()
        env.pop('LD_PRELOAD', None)

        # Clear Qt library path issues that cause Qt_6_PRIVATE_API errors
        env.pop('QT_PLUGIN_PATH', None)
        env.pop('QML2_IMPORT_PATH', None)
        env.pop('QTWEBENGINEPROCESS_PATH', None)

        # Force Qt to use system libraries instead of bundled ones
        if platform.system() != "Windows":
            env['QT_QPA_PLATFORM'] = 'xcb'

        # Disable Qt high-DPI scaling to avoid conflicts
        env['QT_AUTO_SCREEN_SCALE_FACTOR'] = '0'
        env['QT_ENABLE_HIGHDPI_SCALING'] = '0'

        # Set library path to use system Qt
        env.pop('QT_INSTALL_PREFIX', None)
        env.pop('QT_INSTALL_PLUGINS', None)

        result = subprocess.run(command, capture_output=True, text=True, env=env, timeout=300)

        if result.returncode != 0:
            logger.warn(f"Cyberia: ACCELA failed with return code {result.returncode}")
            if result.stderr:
                logger.warn(f"Cyberia: ACCELA stderr: {result.stderr}")
            raise RuntimeError(f"ACCELA execution failed with code {result.returncode}")

        logger.log("Cyberia: ACCELA completed successfully")
        if result.stdout:
            logger.log(f"Cyberia: ACCELA output: {result.stdout}")

        _set_download_state(appid, {"installedPath": zip_path})
    except subprocess.TimeoutExpired:
        logger.warn("Cyberia: ACCELA execution timed out after 300 seconds")
        raise RuntimeError("ACCELA execution timed out (300s limit reached)")
    except Exception as exc:
        logger.warn("Cyberia: Failed to execute ACCELA: {exc}")
        raise RuntimeError(f"ACCELA execution failed: {exc}")

    try:
        os.remove(zip_path)
    except Exception:
        try:
            for _ in range(3):
                time.sleep(0.2)
                try:
                    os.remove(zip_path)
                    break
                except Exception:
                    continue
        except Exception:
            pass


def _is_download_cancelled(appid: int) -> bool:
    try:
        return _get_download_state(appid).get("status") == "cancelled"
    except Exception:
        return False


def _download_zip_for_app(appid: int):
    client = ensure_http_client("Cyberia: download")
    apis = load_api_manifest()
    if not apis:
        logger.warn("Cyberia: No enabled APIs in manifest")
        _set_download_state(appid, {"status": "failed", "error": "No APIs available"})
        return

    dest_root = ensure_temp_download_dir()
    dest_path = os.path.join(dest_root, f"{appid}.zip")
    _set_download_state(
        appid,
        {
            "status": "checking",
            "currentApi": None,
            "bytesRead": 0,
            "totalBytes": 0,
            "dest": dest_path,
        },
    )

    for api in apis:
        name = api.get("name", "Unknown")
        template = api.get("url", "")
        api_key = api.get("api_key", "")
        success_code = 200
        unavailable_code = 404
        url = template.replace("<appid>", str(appid))
        _set_download_state(
            appid,
            {"status": "checking", "currentApi": name, "bytesRead": 0, "totalBytes": 0},
        )
        logger.log(f"Cyberia: Trying API '{name}' -> {url}")
        try:
            logger.log(f"Trying with key: Bearer {api_key}")
            headers = {
                "User-Agent": USER_AGENT,
            }
            if api_key:
                headers["Authorization"] = f"Bearer {api_key}"
            if _is_download_cancelled(appid):
                logger.log(
                    f"Cyberia: Download cancelled before contacting API '{name}'"
                )
                return
            with client.stream(
                "GET", url, headers=headers, follow_redirects=True
            ) as resp:
                code = resp.status_code
                logger.log(f"Cyberia: API '{name}' status={code}")
                if code == unavailable_code:
                    continue
                if code != success_code:
                    continue
                total = int(resp.headers.get("Content-Length", "0") or "0")
                _set_download_state(
                    appid,
                    {"status": "downloading", "bytesRead": 0, "totalBytes": total},
                )
                with open(dest_path, "wb") as output:
                    for chunk in resp.iter_bytes():
                        if not chunk:
                            continue
                        if _is_download_cancelled(appid):
                            logger.log(
                                f"Cyberia: Download cancelled mid-stream for appid={appid}"
                            )
                            raise RuntimeError("cancelled")
                        output.write(chunk)
                        state = _get_download_state(appid)
                        read = int(state.get("bytesRead", 0)) + len(chunk)
                        _set_download_state(appid, {"bytesRead": read})
                        if _is_download_cancelled(appid):
                            logger.log(
                                f"Cyberia: Download cancelled after writing chunk for appid={appid}"
                            )
                            raise RuntimeError("cancelled")
                logger.log(f"Cyberia: Download complete -> {dest_path}")

                if _is_download_cancelled(appid):
                    logger.log(
                        f"Cyberia: Download marked cancelled after completion for appid={appid}"
                    )
                    raise RuntimeError("cancelled")

                try:
                    with open(dest_path, "rb") as fh:
                        magic = fh.read(4)
                        if magic not in (b"PK\x03\x04", b"PK\x05\x06", b"PK\x07\x08"):
                            file_size = os.path.getsize(dest_path)
                            with open(dest_path, "rb") as check_f:
                                preview = check_f.read(512)
                                content_preview = preview[:100].decode(
                                    "utf-8", errors="ignore"
                                )
                            logger.warn(
                                f"Cyberia: API '{name}' returned non-zip file (magic={magic.hex()}, size={file_size}, preview={content_preview[:50]})"
                            )
                            try:
                                os.remove(dest_path)
                            except Exception:
                                pass
                            continue
                except FileNotFoundError:
                    logger.warn("Cyberia: Downloaded file not found after download")
                    continue
                except Exception as validation_exc:
                    logger.warn(
                        f"Cyberia: File validation failed for API '{name}': {validation_exc}"
                    )
                    try:
                        os.remove(dest_path)
                    except Exception:
                        pass
                    continue

                try:
                    if _is_download_cancelled(appid):
                        logger.log(
                            f"Cyberia: Processing aborted due to cancellation for appid={appid}"
                        )
                        raise RuntimeError("cancelled")
                    _set_download_state(appid, {"status": "processing"})
                    _process_and_install_lua(appid, dest_path)
                    if _is_download_cancelled(appid):
                        logger.log(
                            f"Cyberia: Installation complete but marked cancelled for appid={appid}"
                        )
                        raise RuntimeError("cancelled")
                    _set_download_state(
                        appid, {"status": "done", "success": True, "api": name}
                    )
                    return
                except Exception as install_exc:
                    if (
                        isinstance(install_exc, RuntimeError)
                        and str(install_exc) == "cancelled"
                    ):
                        try:
                            if os.path.exists(dest_path):
                                os.remove(dest_path)
                        except Exception:
                            pass
                        logger.log(
                            f"Cyberia: Cancelled download cleanup complete for appid={appid}"
                        )
                        return
                    logger.warn(f"Cyberia: Processing failed -> {install_exc}")
                    _set_download_state(
                        appid,
                        {
                            "status": "failed",
                            "error": f"Processing failed: {install_exc}",
                        },
                    )
                    try:
                        os.remove(dest_path)
                    except Exception:
                        pass
                    return
        except RuntimeError as cancel_exc:
            if str(cancel_exc) == "cancelled":
                try:
                    if os.path.exists(dest_path):
                        os.remove(dest_path)
                except Exception:
                    pass
                logger.log(
                    f"Cyberia: Download cancelled and cleaned up for appid={appid}"
                )
                return
            logger.warn(
                f"Cyberia: Runtime error during download for appid={appid}: {cancel_exc}"
            )
            _set_download_state(appid, {"status": "failed", "error": str(cancel_exc)})
            return
        except Exception as err:
            logger.warn(f"Cyberia: API '{name}' failed with error: {err}")
            continue

    _set_download_state(
        appid, {"status": "failed", "error": "Not available on any API"}
    )


def start_add_via_cyberia(appid: int) -> str:
    try:
        appid = int(appid)
    except Exception:
        return json.dumps({"success": False, "error": "Invalid appid"})

    logger.log(f"Cyberia: StartAddViaCyberia appid={appid}")
    _set_download_state(appid, {"status": "queued", "bytesRead": 0, "totalBytes": 0})
    thread = threading.Thread(target=_download_zip_for_app, args=(appid,), daemon=True)
    thread.start()
    return json.dumps({"success": True})


def get_add_status(appid: int) -> str:
    try:
        appid = int(appid)
    except Exception:
        return json.dumps({"success": False, "error": "Invalid appid"})
    state = _get_download_state(appid)
    return json.dumps({"success": True, "state": state})


def cancel_add_via_cyberia(appid: int) -> str:
    try:
        appid = int(appid)
    except Exception:
        return json.dumps({"success": False, "error": "Invalid appid"})

    state = _get_download_state(appid)
    if not state or state.get("status") in {"done", "failed"}:
        return json.dumps({"success": True, "message": "Nothing to cancel"})

    _set_download_state(appid, {"status": "cancelled", "error": "Cancelled by user"})
    logger.log(f"Cyberia: Cancellation requested for appid={appid}")
    return json.dumps({"success": True})


__all__ = ["cancel_add_via_cyberia", "get_add_status", "start_add_via_cyberia"]
