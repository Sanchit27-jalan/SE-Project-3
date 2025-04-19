from fastapi import APIRouter, Depends, HTTPException
from app.services.generator_service import GeneratorService
from app.models.generator_model import UserRequest

class GeneratorController:
    def __init__(self):
        self.router = APIRouter(prefix="/api")
        self.service = GeneratorService()
        
        # Register routes
        self.router.add_api_route(
            "/generate_tool", 
            self.generate_tool, 
            methods=["POST"]
        )
        self.router.add_api_route(
            "/generate_agent", 
            self.generate_agent, 
            methods=["POST"]
        )
    
    async def generate_tool(self, request: UserRequest):
        """Controller method for tool generation endpoint"""
        tool = self.service.generate_tool(request.user_prompt)
        return {"tool": tool}
    
    async def generate_agent(self, request: UserRequest):
        """Controller method for agent generation endpoint"""
        agent = self.service.generate_agent(request.user_prompt)
        return {"agent": agent}
