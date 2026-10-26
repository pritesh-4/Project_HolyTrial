"""Security and Data Validation Infrastructure

Implements:
- SSRF (Server-Side Request Forgery) protection for remote URL ingestion.
- File upload path sanitization and extension whitelisting.
- Cryptographic checksum generation for evidence integrity.
"""

import hashlib
import ipaddress
import re
import socket
from pathlib import Path
from urllib.parse import urlparse

from app.core.config import settings


class SecurityError(ValueError):
    """Raised when a security validation fails."""
    pass


def validate_safe_url(url: str) -> None:
    """Validate that a URL is safe to fetch from the server.
    
    Protects against SSRF vulnerabilities by ensuring:
    - Scheme is HTTP or HTTPS.
    - Hostname is not localhost or internal.
    - Resolved IP addresses are public, not in loopback, private, link-local,
      multicast, or reserved ranges.
    """
    if not url or not isinstance(url, str):
        raise SecurityError("URL must be a non-empty string.")

    try:
        parsed = urlparse(url.strip())
    except Exception as e:
        raise SecurityError(f"Malformed URL: {e}") from e

    if parsed.scheme.lower() not in ("http", "https"):
        raise SecurityError(f"Unsupported URL scheme '{parsed.scheme}'. Only HTTP and HTTPS are permitted.")

    hostname = parsed.hostname
    if not hostname:
        raise SecurityError("URL must include a valid hostname.")

    hostname_lower = hostname.lower()

    # Block well-known internal hostnames
    if hostname_lower in ("localhost", "127.0.0.1", "::1") or hostname_lower.endswith((".local", ".internal", ".localhost", ".lan")):
        raise SecurityError(f"Access to internal host '{hostname}' is blocked.")

    # Resolve hostname to all associated IP addresses
    port = parsed.port or (443 if parsed.scheme.lower() == "https" else 80)
    try:
        addr_info = socket.getaddrinfo(hostname, port, type=socket.SOCK_STREAM)
    except socket.gaierror as e:
        raise SecurityError(f"Could not resolve host '{hostname}': {e}") from e

    for entry in addr_info:
        sockaddr = entry[4]
        ip_str = sockaddr[0]
        try:
            ip = ipaddress.ip_address(ip_str)
        except ValueError as e:
            raise SecurityError(f"Invalid resolved IP '{ip_str}': {e}") from e

        if ip.is_loopback:
            raise SecurityError(f"URL resolves to loopback address ({ip}). Access blocked.")
        if ip.is_private:
            raise SecurityError(f"URL resolves to private network address ({ip}). Access blocked.")
        if ip.is_link_local:
            raise SecurityError(f"URL resolves to link-local address ({ip}). Access blocked.")
        if ip.is_multicast:
            raise SecurityError(f"URL resolves to multicast address ({ip}). Access blocked.")
        if ip.is_reserved:
            raise SecurityError(f"URL resolves to reserved address ({ip}). Access blocked.")
        if ip.is_unspecified:
            raise SecurityError(f"URL resolves to unspecified address ({ip}). Access blocked.")


def sanitize_filename(filename: str) -> str:
    """Sanitize filename to prevent path traversal and shell injection.
    
    Strips directory separators, null bytes, and non-whitelisted characters.
    """
    if not filename:
        return "unnamed_evidence"

    # Extract basename only
    base = Path(filename).name

    # Remove null bytes and path traversal patterns
    cleaned = base.replace("\x00", "").replace("..", "")

    # Retain alphanumeric characters, dots, underscores, hyphens
    cleaned = re.sub(r"[^\w.\-]", "_", cleaned).strip("._")

    if not cleaned:
        return "unnamed_evidence"

    # Limit filename length
    if len(cleaned) > 100:
        stem = Path(cleaned).stem[:90]
        suffix = Path(cleaned).suffix[:10]
        cleaned = f"{stem}{suffix}"

    return cleaned


def is_allowed_extension(filename: str) -> bool:
    """Check if the file extension is permitted for evidence upload."""
    ext = Path(filename).suffix.lower()
    return ext in settings.ALLOWED_UPLOAD_EXTENSIONS


def compute_sha256(data: bytes) -> str:
    """Compute SHA-256 checksum for binary data."""
    return hashlib.sha256(data).hexdigest()
