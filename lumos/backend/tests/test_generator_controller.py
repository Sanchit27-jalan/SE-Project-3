import unittest
from unittest.mock import patch
import asyncio
from httpx import AsyncClient, ASGITransport
import sys, os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from app.main import app

class TestGeneratorController(unittest.TestCase):
    @staticmethod
    def _post(path, payload):
        async def _do():
            async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
                return await client.post(path, json=payload)
        return asyncio.run(_do())

    @patch('app.controllers.generator_controller.GeneratorService.generate_tool')
    def test_generate_tool(self, mock_generate):
        mock_generate.return_value = {'id': 'tool1', 'name': 'Tool1'}
        payload = {'user_prompt': 'create a tool'}
        response = self._post('/api/generate_tool', payload)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json().get('tool'), {'id': 'tool1', 'name': 'Tool1'})

    @patch('app.controllers.generator_controller.GeneratorService.generate_agent')
    def test_generate_agent(self, mock_generate):
        mock_generate.return_value = {'id': 'agent1', 'name': 'Agent1'}
        payload = {'user_prompt': 'create an agent'}
        response = self._post('/api/generate_agent', payload)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json().get('agent'), {'id': 'agent1', 'name': 'Agent1'})