from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from ..services.project_service import ProjectService
from ..schemas.project_schema import ProjectExport

router = APIRouter()
service = ProjectService()

class ProjectSave(BaseModel):
    project: Dict[str, Any]
    agents: List[Dict[str, Any]]
    tools: Optional[List[Dict[str, Any]]] = []
    interactions: Optional[List[Dict[str, Any]]] = []
    connections: Optional[List[Dict[str, Any]]] = []

@router.post("/export")
async def export_project(project_data: ProjectExport):
    result = await service.export_project(project_data)
    # Handle any error status prefix
    if result["status"].startswith("error"):
        # Extract message after 'error:' if present
        msg = result["status"].split(":", 1)[1].strip() if ":" in result["status"] else "Error exporting project"
        raise HTTPException(status_code=400, detail=msg)
    return {"message": "Project exported successfully","url":result["ngrok_url"]}

@router.post("/save")
async def save_project(project_data: ProjectSave):
    try:
        print("Received save request with data:")
        print(f"Project: {project_data.project}")
        print(f"Agents count: {len(project_data.agents)}")
        print(f"Tools count: {len(project_data.tools)}")
        print(f"Interactions count: {len(project_data.interactions)}")
        
        # Validate required fields
        if not project_data.project or not project_data.project.get('name'):
            print("❌ ERROR: Missing project name")
            return JSONResponse(
                status_code=400,
                content={"status": "error", "message": "Project name is required"}
            )
        
        result = service.save_project(project_data.dict())
        
        print(f"Save result: {result}")
        
        if result.get("status") == "error":
            print(f"❌ ERROR in save_project: {result['message']}")
            return JSONResponse(
                status_code=400,  # Changed from 200 to 400 for errors
                content={"status": "error", "message": result["message"]}
            )
            
        return {"status": "success", "project_id": result.get("project_id")}
    except Exception as e:
        print(f"❌ EXCEPTION in save_project: {str(e)}")
        return JSONResponse(
            status_code=500,  # Use 500 for server exceptions
            content={"status": "error", "message": str(e)}
        )

@router.get("/projects")
async def get_all_projects():
    """
    Retrieve all saved projects from the database
    """
    try:
        result = service.get_all_projects()
        
        # Debug logs
        print(f"Retrieved {len(result.get('projects', []))} projects")
        
        if result["status"] == "error":
            print(f"❌ ERROR in get_all_projects: {result['message']}")
            return {"status": "error", "message": result["message"]}
            
        return {"status": "success", "projects": result["projects"]}
    except Exception as e:
        print(f"❌ EXCEPTION in get_all_projects: {str(e)}")
        return {"status": "error", "message": str(e)}

@router.get("/projects/{project_id}")
async def get_project_by_id(project_id: int):
    """
    Get details for a specific project by ID
    """
    try:
        result = service.get_project_by_id(project_id)
        
        if result["status"] == "error":
            print(f"❌ ERROR in get_project_by_id: {result['message']}")
            return JSONResponse(
                status_code=404,
                content={"status": "error", "message": result["message"]}
            )
            
        return {"status": "success", "project": result["project"]}
    except Exception as e:
        print(f"❌ EXCEPTION in get_project_by_id: {str(e)}")
        return JSONResponse(
            status_code=500,
            content={"status": "error", "message": str(e)}
        )