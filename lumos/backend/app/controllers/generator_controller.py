from fastapi import APIRouter, Depends, HTTPException
from app.models.generator_model import UserRequest
from app.services.generator_service import GeneratorService
from ..store.store import store
from ..actions.generator_actions import generate_tool_action, generate_agent_action

class GeneratorController:
    def __init__(self):
        self.router = APIRouter(prefix="/api")
        
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
        # dispatch async action and await result
        result = await store.dispatch(generate_tool_action(request.user_prompt))
        return {"tool": result}
    
    async def generate_agent(self, request: UserRequest):
        """Controller method for agent generation endpoint"""
        # dispatch async action and await result
        result = await store.dispatch(generate_agent_action(request.user_prompt))
        return {"agent": result}
