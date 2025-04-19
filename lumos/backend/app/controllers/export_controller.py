from fastapi import APIRouter, HTTPException
from ..schemas.project_schema import ProjectExport
from ..schemas.project_schema import ProjectSave
from ..store.store import store
from ..actions.project_actions import export_project_action, save_project_action
from ..services.project_service import ProjectService

service = ProjectService()

router = APIRouter()

@router.post("/export")
async def export_project(project_data: ProjectExport):
    result = await store.dispatch(export_project_action(project_data))
    # Handle any error status prefix
    if result["status"].startswith("error"):
        msg = result["status"].split(":", 1)[1].strip() if ":" in result["status"] else "Error exporting project"
        raise HTTPException(status_code=400, detail=msg)
    return {"message": "Project exported successfully","url":result["ngrok_url"]}

@router.post("/save")
async def save_project(project_data: ProjectSave):
    # Convert to dict and save to database
    result = store.dispatch(save_project_action(project_data))
    if result["status"] == "error":
        raise HTTPException(status_code=400, detail=result["message"])
    return {"status": "success", "project_id": result["project_id"]}