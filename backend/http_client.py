"""Shared HTTP client management for the Cyberia backend."""

from typing import Optional

try:
    import httpx  # type: ignore
    httpx_available = True
except ImportError:
    httpx_available = False

from config import HTTP_TIMEOUT_SECONDS
from logger import logger

_HTTP_CLIENT: Optional["httpx.Client"] = None


def ensure_http_client(context: str = "") -> httpx.Client:
    """Create the shared HTTP client if needed and return it."""
    global _HTTP_CLIENT

    if not httpx_available:
        error_msg = (
            "httpx is not installed. Please install it with: pip install httpx==0.27.2\n"
            "If you're using Millennium, install httpx in the Python environment "
            "that Millennium uses."
        )
        logger.error(error_msg)
        raise ImportError(error_msg)

    if _HTTP_CLIENT is None:
        prefix = f"{context}: " if context else ""
        logger.log(f"{prefix}Initializing shared HTTPX client...")
        try:
            _HTTP_CLIENT = httpx.Client(timeout=HTTP_TIMEOUT_SECONDS)
            logger.log(f"{prefix}HTTPX client initialized")
        except Exception as exc:
            logger.error(f"{prefix}Failed to initialize HTTPX client: {exc}")
            raise
    return _HTTP_CLIENT


def close_http_client(context: str = "") -> None:
    """Close and dispose of the shared HTTP client."""
    global _HTTP_CLIENT
    if _HTTP_CLIENT is None:
        return

    try:
        _HTTP_CLIENT.close()
    except Exception:
        pass
    finally:
        _HTTP_CLIENT = None
        prefix = f"{context}: " if context else ""
        logger.log(f"{prefix}HTTPX client closed")

