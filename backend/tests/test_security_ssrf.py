"""SSRF Protection and Ingestion Security Tests
"""

import pytest
from app.core.security import SecurityError, validate_safe_url


def test_ssrf_rejects_loopback_ips():
    with pytest.raises(SecurityError, match="loopback|internal"):
        validate_safe_url("http://127.0.0.1:8000/api/v1/cases")

    with pytest.raises(SecurityError, match="internal|loopback"):
        validate_safe_url("http://localhost:3000/secret")


def test_ssrf_rejects_private_ips():
    with pytest.raises(SecurityError, match="private|internal"):
        validate_safe_url("http://192.168.1.1/admin/router")

    with pytest.raises(SecurityError, match="private|internal"):
        validate_safe_url("http://10.0.0.15:8080/metrics")

    with pytest.raises(SecurityError, match="private|internal"):
        validate_safe_url("http://172.16.0.5/internal")


def test_ssrf_rejects_cloud_metadata():
    with pytest.raises(SecurityError, match="link-local|private"):
        validate_safe_url("http://169.254.169.254/latest/meta-data")


def test_ssrf_rejects_unsupported_schemes():
    with pytest.raises(SecurityError, match="Unsupported URL scheme"):
        validate_safe_url("file:///etc/passwd")

    with pytest.raises(SecurityError, match="Unsupported URL scheme"):
        validate_safe_url("ftp://ftp.internal.archive/dump.tar")


def test_api_rejects_ssrf_url_ingest(client):
    create_resp = client.post(
        "/api/v1/cases",
        json={
            "proposition": "Decentralized storage resists censorship better than centralized clouds.",
            "category": "Technology & AI",
        },
    )
    case_id = create_resp.json()["id"]

    resp = client.post(
        f"/api/v1/cases/{case_id}/evidence/url",
        json={
            "title": "Internal Admin Console",
            "source_url": "http://127.0.0.1:9000/metrics",
        },
    )
    assert resp.status_code == 400
    assert "security rejection" in resp.json()["detail"].lower()
