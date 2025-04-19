from fastapi import APIRouter, HTTPException
from ..schemas.project_schema import ProjectExport
from ..services.project_service import ProjectService
from ..schemas.project_schema import ProjectSave


router = APIRouter()
service = ProjectService()

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
    # Convert to dict and save to database
    result = service.save_project(project_data.dict())
    if result["status"] == "error":
        raise HTTPException(status_code=400, detail=result["message"])
    return {"status": "success", "project_id": result["project_id"]}