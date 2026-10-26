"""Case Management API Tests
"""

def test_create_case_success(client):
    payload = {
        "proposition": "Autonomous verification systems will eliminate 80% of regression bugs.",
        "category": "Technology & AI",
        "notes": "Preliminary judicial filing for test validation.",
    }
    response = client.post("/api/v1/cases", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["proposition"] == payload["proposition"]
    assert data["category"] == "Technology & AI"
    assert data["status"] == "awaiting_evidence"
    assert data["id"].startswith("CASE-")
    assert data["evidence_count"] == 0
    assert data["analysis_count"] == 0


def test_create_case_rejects_too_short(client):
    payload = {
        "proposition": "Too short",
        "category": "Technology & AI",
    }
    response = client.post("/api/v1/cases", json=payload)
    assert response.status_code == 422


def test_create_case_rejects_question_mark(client):
    payload = {
        "proposition": "Will autonomous AI systems replace human judicial officers by 2030?",
        "category": "Technology & AI",
    }
    response = client.post("/api/v1/cases", json=payload)
    assert response.status_code == 422


def test_list_and_filter_cases(client):
    # Insert two cases of different categories
    client.post(
        "/api/v1/cases",
        json={
            "proposition": "Quantum computing will break RSA encryption within the next five years.",
            "category": "Science & Energy",
        },
    )
    client.post(
        "/api/v1/cases",
        json={
            "proposition": "Electric vertical takeoff vehicles will attain commercial urban certification.",
            "category": "Products & Business",
        },
    )

    # List all
    all_resp = client.get("/api/v1/cases")
    assert all_resp.status_code == 200
    assert all_resp.json()["total"] >= 2

    # Filter by category
    filter_resp = client.get("/api/v1/cases", params={"category": "Science & Energy"})
    assert filter_resp.status_code == 200
    items = filter_resp.json()["items"]
    assert len(items) == 1
    assert items[0]["category"] == "Science & Energy"


def test_get_single_case_lifecycle(client):
    create_resp = client.post(
        "/api/v1/cases",
        json={
            "proposition": "Nuclear small modular reactors provide cheaper baseload power than gas.",
            "category": "Science & Energy",
        },
    )
    case_id = create_resp.json()["id"]

    get_resp = client.get(f"/api/v1/cases/{case_id}")
    assert get_resp.status_code == 200
    assert get_resp.json()["id"] == case_id

    # Update case notes
    patch_resp = client.patch(
        f"/api/v1/cases/{case_id}",
        json={"notes": "Updated scope to include Generation IV designs."},
    )
    assert patch_resp.status_code == 200
    assert patch_resp.json()["notes"] == "Updated scope to include Generation IV designs."

    # Delete case
    del_resp = client.delete(f"/api/v1/cases/{case_id}")
    assert del_resp.status_code == 204

    # Confirm 404
    missing_resp = client.get(f"/api/v1/cases/{case_id}")
    assert missing_resp.status_code == 404
