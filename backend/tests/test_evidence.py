"""Evidence Ingestion and Management Tests
"""

import io


def test_attach_text_evidence(client):
    create_resp = client.post(
        "/api/v1/cases",
        json={
            "proposition": "Decentralized physical infrastructure networks reduce operating overhead.",
            "category": "Technology & AI",
        },
    )
    case_id = create_resp.json()["id"]

    ev_resp = client.post(
        f"/api/v1/cases/{case_id}/evidence/text",
        json={
            "title": "Stanford Operating Cost Audit 2026",
            "content": "Empirical audit demonstrated a 42% reduction in recurring server costs across decentralized clusters.",
            "provenance": "Stanford Department of Computer Science",
        },
    )
    assert ev_resp.status_code == 201
    ev_data = ev_resp.json()
    assert ev_data["case_id"] == case_id
    assert ev_data["title"] == "Stanford Operating Cost Audit 2026"
    assert ev_data["status"] == "processed"
    assert ev_data["checksum"] is not None
    assert len(ev_data["checksum"]) == 64  # SHA-256 length

    # Check case evidence list
    list_resp = client.get(f"/api/v1/cases/{case_id}/evidence")
    assert list_resp.status_code == 200
    assert list_resp.json()["total"] == 1


def test_upload_file_evidence(client):
    create_resp = client.post(
        "/api/v1/cases",
        json={
            "proposition": "Solid state batteries will enter mass production passenger vehicles by 2028.",
            "category": "Science & Energy",
        },
    )
    case_id = create_resp.json()["id"]

    file_content = b"Battery manufacturing pilot yielded 98% cell purity with zero thermal runaway under stress testing."
    files = {
        "file": ("manufacturing_report.txt", io.BytesIO(file_content), "text/plain"),
    }
    data = {
        "title": "Pilot Cell Stress Test Log",
        "provenance": "Toyota Advanced Battery Research Lab",
    }

    upload_resp = client.post(
        f"/api/v1/cases/{case_id}/evidence/upload",
        files=files,
        data=data,
    )
    assert upload_resp.status_code == 201
    ev = upload_resp.json()
    assert ev["title"] == "Pilot Cell Stress Test Log"
    assert ev["content"] == file_content.decode("utf-8")
    assert ev["status"] == "processed"
    assert ev["file_name"] == "manufacturing_report.txt"
    assert ev["checksum"] is not None


def test_reject_unsupported_file_extension(client):
    create_resp = client.post(
        "/api/v1/cases",
        json={
            "proposition": "Generative agents can autonomously deploy production cloud infrastructures.",
            "category": "Technology & AI",
        },
    )
    case_id = create_resp.json()["id"]

    files = {
        "file": ("dangerous_script.exe", io.BytesIO(b"binary executable"), "application/octet-stream"),
    }
    upload_resp = client.post(
        f"/api/v1/cases/{case_id}/evidence/upload",
        files=files,
        data={"title": "Malicious payload"},
    )
    assert upload_resp.status_code == 400
    assert "extension not permitted" in upload_resp.json()["detail"].lower()


def test_attach_evidence_to_missing_case_returns_404(client):
    resp = client.post(
        "/api/v1/cases/CASE-9999-XXXX/evidence/text",
        json={
            "title": "Ghost Evidence",
            "content": "Valid evidence content that has no parent docket.",
        },
    )
    assert resp.status_code == 404
