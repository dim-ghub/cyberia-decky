"""Shared HTTP client management for the Cyberia backend."""

from typing import Optional

try:
    import httpx  # type: ignore
    # Try to import Client directly to ensure compatibility
    try:
        from httpx import Client as HTTPXClient
        httpx_available = True
    except (ImportError, AttributeError) as e:
        # Fallback to httpx.Client for older versions
        try:
            HTTPXClient = httpx.Client
            httpx_available = True
        except AttributeError:
            httpx_available = False
            httpx_import_error = str(e)
except ImportError:
    httpx_available = False
    httpx_import_error = "httpx module not found"

from config import HTTP_TIMEOUT_SECONDS
from logger import logger

_HTTP_CLIENT: Optional["HTTPXClient"] = None


def ensure_http_client(context: str = "") -> "HTTPXClient":
    """Create the shared HTTP client if needed and return it."""
    global _HTTP_CLIENT

    if not httpx_available:
        error_msg = (
            f"httpx is not installed or not compatible. Please install it with: pip install httpx==0.27.2\n"
            f"Error details: {httpx_import_error}\n"
            "If you're using Millennium, install httpx in the Python environment "
            "that Millennium uses."
        )
        logger.error(error_msg)
        raise ImportError(error_msg)

    if _HTTP_CLIENT is None:
        prefix = f"{context}: " if context else ""
        logger.log(f"{prefix}Initializing shared HTTPX client...")
        try:
            _HTTP_CLIENT = HTTPXClient(timeout=HTTP_TIMEOUT_SECONDS)
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

