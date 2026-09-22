"""
Smoke integration test: upload small CSV, call /generate, assert non-empty image_base64.
Run from project root: python -m pytest tests/integration_generate.py -v
"""
import os
import sys
import pytest

# Ensure backend is on path (conftest does this; duplicate for standalone run)
_backend = os.path.join(os.path.dirname(__file__), "..", "backend")
if _backend not in sys.path:
    sys.path.insert(0, _backend)

from fastapi.testclient import TestClient
from main import app

client = TestClient(app)


def test_upload_and_generate():
    csv_path = os.path.join(os.path.dirname(__file__), "..", "datasets", "example_data.csv")
    if not os.path.isfile(csv_path):
        pytest.skip("example_data.csv not found")
    with open(csv_path, "rb") as f:
        content = f.read()
    upload = client.post("/upload", files={"file": ("example_data.csv", content, "text/csv")})
    assert upload.status_code == 200
    session_id = upload.json().get("session_id")
    assert session_id
    gen = client.post(
        "/generate",
        data={"prompt": "location", "session_id": session_id, "use_plotly": False},
    )
    assert gen.status_code == 200
    data = gen.json()
    assert data.get("image_base64")
    assert len(data["image_base64"]) > 100
    assert data.get("explanation")
    assert "count" in data.get("explanation", "").lower() or "location" in data.get("explanation", "").lower()
