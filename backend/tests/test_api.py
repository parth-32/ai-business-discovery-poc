"""Backend integration unit tests."""

import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.database import init_database

client = TestClient(app)


@pytest.fixture(autouse=True)
def setup_db():
    init_database()


def test_health_endpoint():
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"


def test_project_crud():
    # Create project
    res = client.post("/api/projects", json={"name": "Test Discovery Project"})
    assert res.status_code == 201
    project = res.json()
    assert project["name"] == "Test Discovery Project"
    project_id = project["id"]

    # List projects
    res = client.get("/api/projects")
    assert res.status_code == 200
    projects = res.json()
    assert any(p["id"] == project_id for p in projects)

    # Get project detail
    res = client.get(f"/api/projects/{project_id}")
    assert res.status_code == 200
    assert res.json()["id"] == project_id

    # Load sample scenario data
    res = client.post(f"/api/projects/{project_id}/load-sample/logistics")
    assert res.status_code == 200
    inputs = res.json()
    assert len(inputs) > 0

    # Delete project
    res = client.delete(f"/api/projects/{project_id}")
    assert res.status_code == 204
