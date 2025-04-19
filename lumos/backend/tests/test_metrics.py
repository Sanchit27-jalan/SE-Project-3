import pytest
import asyncio
from httpx import AsyncClient, ASGITransport
from app.main import app

def _get(path):
    async def _do():
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            return await client.get(path)
    return asyncio.run(_do())

@pytest.mark.parametrize("endpoint, expected_status", [
    ("/metrics/data", 200),
    ("/metrics", 200)
])
def test_metrics_endpoints_return_success(endpoint, expected_status):
    response = _get(endpoint)
    assert response.status_code == expected_status


def test_metrics_data_structure():
    response = _get("/metrics/data")
    data = response.json()
    # Check keys exist
    for key in ["average_latency", "cpu_percent", "memory_percent", "uptime", "latencies"]:
        assert key in data
    # Check types
    assert isinstance(data["average_latency"], (int, float))
    assert isinstance(data["cpu_percent"], (int, float))
    assert isinstance(data["memory_percent"], (int, float))
    assert isinstance(data["uptime"], (int, float))
    assert isinstance(data["latencies"], list)


def test_metrics_dashboard_content_type_and_body():
    response = _get("/metrics")
    assert response.headers["content-type"].startswith("text/html")
    # Basic check that the HTML contains a dashboard title
    assert "Server Metrics Dashboard" in response.text
