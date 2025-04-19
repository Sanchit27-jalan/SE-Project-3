from ..models.project_model import ProjectModel
from ..schemas.project_schema import ProjectExport
import asyncio
import aiofiles
import aiohttp
import socket 
import random 
import subprocess
import time 
import string 
import os
import json 
import requests
import subprocess
from ..utils.network_utils import random_free_port, random_name, random_port
from collections import deque
from datetime import datetime


# Constants
MAX_CONCURRENT_EXPORTS = 3
EXPORT_TIMEOUT = 300  # 5 minutes

class ProjectService:
    def __init__(self):
        self.model = ProjectModel()
        self.queue = deque()
        self.active_tasks = set()
        self.lock = asyncio.Lock()
        # Start the scheduler if an event loop is already running
        try:
            loop = asyncio.get_running_loop()
            loop.create_task(self._process_queue())
        except RuntimeError:
            # No running loop (e.g., during testing import), defer scheduling
            pass

    async def _process_queue(self):
        """Background task to process the export queue"""
        while True:
            async with self.lock:
                if len(self.active_tasks) >= MAX_CONCURRENT_EXPORTS or not self.queue:
                    await asyncio.sleep(1)
                    continue
                
                task_id, project_data, future = self.queue.popleft()
                self.active_tasks.add(task_id)
            
            try:
                result = await self._execute_export(project_data)
                future.set_result(result)
            except Exception as e:
                future.set_exception(e)
            finally:
                async with self.lock:
                    self.active_tasks.discard(task_id)

    async def export_project(self, project_data: ProjectExport):
        """Export project with same return structure but with queuing"""
        # Create a future to await the result
        future = asyncio.Future()
        task_id = ''.join(random.choices(string.ascii_lowercase + string.digits, k=12))
        
        async with self.lock:
            self.queue.append((task_id, project_data, future))
        
        # Wait for the result (this will block until the task is processed)
        try:
            result = await future
            return {
                "container": result["container"],
                "ngrok_url": result["ngrok_url"],
                "status": "success"
            }
        except Exception as e:
            return {
                "container": "",
                "ngrok_url": "",
                "status": f"error: {str(e)}"
            }

    async def _execute_export(self, project_data: ProjectExport):
        """Your original export logic"""
        project_data = project_data.dict()
        data = {
            'project': project_data['project'],
            'agents': project_data['agents'],
            'tools': project_data.get('tools', []),
            'interactions': project_data.get('interactions', [])
        }

        port = random_free_port()
        container_name = f"ui_{random_name()}"
        json_str = json.dumps(data)

        # Build Docker image
        await self._run_async_command(
            "docker", "build", "--no-cache", "-t", "simple-ui-app", "./ui_app"
        )

        # Run Docker container
        await self._run_async_command(
            "docker", "run", "-d",
            "-p", f"{port}:5000",
            "--name", container_name,
            "-e", f"CONFIG={json_str}",
            "simple-ui-app",
            log_path=f"docker_run_{container_name}.log"
        )

        await asyncio.sleep(2)

        # Update route_map.json
        route_name = f"/{container_name}"
        route_map_path = "route_map.json"
        if os.path.exists(route_map_path):
            try:
                async with aiofiles.open(route_map_path, "r") as f:
                    content = await f.read()
                    route_map = json.loads(content.strip()) if content.strip() else {}
            except json.JSONDecodeError:
                route_map = {}
        else:
            route_map = {}

        route_map[container_name] = f"http://localhost:{port}"

        async with aiofiles.open(route_map_path, "w") as f:
            await f.write(json.dumps(route_map, indent=4))

        # Get public ngrok URL
        public_url = None
        async with aiohttp.ClientSession() as session:
            for _ in range(6):
                try:
                    async with session.get("http://localhost:4040/api/tunnels") as resp:
                        tunnel_info = await resp.json()
                        public_url = tunnel_info["tunnels"][0]["public_url"]
                        break
                except Exception:
                    await asyncio.sleep(1)

        if not public_url:
            raise RuntimeError("Ngrok tunnel not found")

        return {
            "container": container_name,
            "ngrok_url": f"{public_url}{route_name}",
            "status": "success"
        }

    async def _run_async_command(self, *cmd, log_path=None):
        """Existing async command runner"""
        stdout = asyncio.subprocess.PIPE
        stderr = asyncio.subprocess.PIPE
        if log_path:
            log_file = await aiofiles.open(log_path, "a")
        else:
            log_file = None

        process = await asyncio.create_subprocess_exec(*cmd, stdout=stdout, stderr=stderr)
        stdout_data, stderr_data = await process.communicate()

        if log_file:
            await log_file.write(stdout_data.decode())
            await log_file.write(stderr_data.decode())
            await log_file.close()

        if process.returncode != 0:
            raise RuntimeError(f"Command {' '.join(cmd)} failed:\n{stderr_data.decode()}")
    
    def save_project(self, project_data: dict):
        try:
            # Convert Pydantic model to dict
            project_dict = {
                'project': project_data['project'],
                'agents': project_data['agents'],
                'tools': project_data.get('tools', []),
                'interactions': project_data.get('interactions', [])
            }
            print(project_data)
            # Convert interactions to connections format for database
            connections = []
            for interaction in project_dict.get('interactions', []):
                if len(interaction.get('participants', [])) >= 2:
                    connections.append({
                        'id': interaction['id'],
                        'source': interaction['participants'][0],
                        'target': interaction['participants'][1],
                        'label': interaction.get('name', '')
                    })
            
            # Final structure for database
            save_data = {
                'project': project_dict['project'],
                'agents': project_dict['agents'],
                'tools': project_dict['tools'],
                'tasks': [],  # Not used in current frontend
                'connections': connections
            }
            
            return self.model.save_project(save_data)
        except Exception as e:
            return {"status": "error", "message": str(e)}

    def get_all_projects(self):
        """
        Retrieve all saved projects from the database.
        """
        try:
            # Fetch all projects from the model
            projects = self.model.get_all_projects()
            return {"status": "success", "projects": projects}
        except Exception as e:
            return {"status": "error", "message": str(e)}

    def get_project_by_id(self, project_id):
        """
        Retrieve a specific project by ID including all its data
        """
        try:
            # Fetch project data from the model
            project = self.model.get_project_by_id(project_id)
            if not project:
                return {"status": "error", "message": f"Project with ID {project_id} not found"}
            
            return {"status": "success", "project": project}
        except Exception as e:
            return {"status": "error", "message": str(e)}

