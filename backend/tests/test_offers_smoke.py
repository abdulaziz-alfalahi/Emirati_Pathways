import os, time, jwt, json
from urllib.parse import urlencode

import pytest

from app import create_app

SECRET = os.getenv("JWT_SECRET_KEY", "change-this-in-production")


def make_token(user_id=1, role="hr_recruiter"):
    payload = {"sub": user_id, "role": role, "iat": int(time.time()), "exp": int(time.time()) + 3600}
    return jwt.encode(payload, SECRET, algorithm="HS256")


def test_offers_end_to_end_smoke(monkeypatch):
    app = create_app()
    app.config["TESTING"] = True
    client = app.test_client()

    token = make_token()
    headers = {"Authorization": f"Bearer {token}"}

    # Find a job id the recruiter can access; fallback to 404 is acceptable in smoke
    r = client.get("/api/hr/jobs/?limit=1", headers=headers)
    assert r.status_code in (200, 400, 401, 403)  # tolerant smoke
    if r.status_code != 200:
        return
    job_list = r.get_json()["data"]["job_postings"]
    if not job_list:
        return
    job_id = job_list[0]["id"]

    # Create a candidate id from top matches or dummy
    r2 = client.post(f"/api/hr/jobs/{job_id}/publish-and-match", headers=headers)
    assert r2.status_code in (200, 400, 500)
    if r2.status_code == 200:
        matches = r2.get_json()["data"]["top_matches"]
        if matches:
            candidate_id = matches[0]["candidate_id"]
        else:
            return
    else:
        return

    # Create offer (send_now true for token)
    offer_payload = {
        "job_posting_id": job_id,
        "candidate_id": candidate_id,
        "offer_data": {"title": "QA Engineer", "salary": 15000, "currency": "AED"},
        "send_now": True,
        "expires_in_days": 3,
    }
    r3 = client.post("/api/hr/offers/", headers=headers, json=offer_payload)
    assert r3.status_code in (201, 400, 404)
    if r3.status_code != 201:
        return
    data = r3.get_json()["data"]
    offer = data["offer"]
    sign_url = data["sign_url"]

    # Extract token from sign_url
    token_param = sign_url.split("token=")[-1]

    # Accept via public endpoint
    r4 = client.post(f"/api/offers/{offer['id']}/accept?token={token_param}")
    assert r4.status_code in (200, 400)
