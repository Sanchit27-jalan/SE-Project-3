from pydantic import BaseModel
from typing import List, Optional, Dict, Any

class ProjectBase(BaseModel):
    name: str
    version: str
    description: str
    authors: List[str] = []

class AgentModel(BaseModel):
    name: Optional[str] = ""
    version: Optional[str] = "latest"
    provider: Optional[str] = ""
    parameters: Optional[Dict[str, Any]] = {}

class AgentTool(BaseModel):
    name: str
    description: str
    type: str
    subtype: Optional[str] = ""
    parameters: Optional[Dict[str, Any]] = {}

class Agent(BaseModel):
    id: str
    name: str
    description: str
    type: str
    subtype: Optional[str] = ""
    model: Optional[AgentModel] = None
    capabilities: List[str] = []
    tools: List[AgentTool] = []

class InteractionProtocol(BaseModel):
    type: str
    messageTypes: List[str] = []

class Interaction(BaseModel):
    id: str
    type: str
    subtype: Optional[str] = ""
    participants: List[str]
    pattern: Optional[str] = ""
    protocol: Optional[InteractionProtocol] = None

class ProjectExport(BaseModel):
    project: ProjectBase
    agents: List[Agent] = []
    interactions: List[Interaction] = []
    
class Position(BaseModel):
    x: int
    y: int

class AgentSave(BaseModel):
    id: str
    name: str
    description: str
    type: str
    subtype: Optional[str] = ""
    model: Optional[dict] = None
    capabilities: List[str] = []
    position: Position

class ToolSave(BaseModel):
    id: str
    name: str
    description: str
    type: str
    subtype: Optional[str] = ""
    parameters: Optional[dict] = {}
    position: Position

class TaskSave(BaseModel):
    id: str
    name: str
    description: str
    type: str
    parameters: Optional[dict] = {}
    position: Position

class ConnectionSave(BaseModel):
    id: str
    source: str
    target: str
    label: Optional[str] = ""

class ProjectSave(BaseModel):
    project: ProjectBase
    agents: List[AgentSave] = []
    tools: List[ToolSave] = []
    tasks: List[TaskSave] = []
    connections: List[ConnectionSave] = []