from pydantic import BaseModel
from typing import Dict, Any, List

class UserRequest(BaseModel):
    user_prompt: str

class Tool(BaseModel):
    name: str
    description: str
    type: str
    subtype: str
    parameters: Dict[str, Any]
    
class Agent(BaseModel):
    name: str
    description: str
    type: str
    subtype: str
    capabilities: List[str]
    suggested_tools: Dict[str, str]