import unittest
from unittest.mock import patch, AsyncMock
import asyncio
from httpx import AsyncClient, ASGITransport
import sys, os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from app.main import app

class TestExportAndSaveController(unittest.TestCase):
    @staticmethod
    def _post(path, payload):
        async def _do():
            async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
                return await client.post(path, json=payload)
        return asyncio.run(_do())

    @patch('app.controllers.export_controller.service')
    def test_export_project_success(self, mock_service):
        mock_service.export_project = AsyncMock(return_value={'ngrok_url': 'http://example', 'status': 'success'})
        payload = {"project": {"name": "test", "version": "1.0", "description": "desc", "authors": []}, "agents": [], "interactions": []}
        response = self._post("/api/export", payload)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json().get("url"), 'http://example')

    @patch('app.controllers.export_controller.service')
    def test_export_project_error(self, mock_service):
        mock_service.export_project = AsyncMock(return_value={'ngrok_url': '', 'status': 'error: fail'})
        payload = {"project": {"name": "test", "version": "1.0", "description": "desc", "authors": []}, "agents": [], "interactions": []}
        response = self._post("/api/export", payload)
        self.assertEqual(response.status_code, 400)

    @patch('app.controllers.export_controller.service')
    def test_save_project_success(self, mock_service):
        mock_service.save_project.return_value = {'status': 'success', 'project_id': 1}
        payload = {"project": {"name": "test", "version": "1.0", "description": "desc", "authors": []}, "agents": [], "tools": [], "tasks": [], "connections": []}
        response = self._post("/api/save", payload)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json().get('project_id'), 1)

    @patch('app.controllers.export_controller.service')
    def test_save_project_error(self, mock_service):
        mock_service.save_project.return_value = {'status': 'error', 'message': 'fail'}
        payload = {"project": {"name": "test", "version": "1.0", "description": "desc", "authors": []}, "agents": [], "tools": [], "tasks": [], "connections": []}
        response = self._post("/api/save", payload)
        self.assertEqual(response.status_code, 400)