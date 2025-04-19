from .database import Database
import json  # Add this import
import mysql.connector
from mysql.connector import Error
from .sql_storage_strategy import SQLProjectStorage

class ProjectModel:
    def __init__(self,strategy=SQLProjectStorage()):
        self.db = Database()
        self.strategy = strategy

    def create_project(self, project_data):
        return self.strategy.create_project(project_data)
       
    def save_project(self, project_data):
        return self.strategy.save_project(project_data)

    def get_all_projects(self):
        """
        Fetch all projects from the database.
        """
        try:
            # Modified query to match the actual schema in schema.sql
            query = "SELECT id, name, version, description, created_at FROM projects"
            conn = self.db.get_connection()
            cursor = conn.cursor(dictionary=True)
            try:
                cursor.execute(query)
                projects = cursor.fetchall()
                return projects
            finally:
                cursor.close()
                conn.close()
        except Exception as e:
            print(f"Error fetching projects: {str(e)}")
            return []  # Return empty list instead of raising exception

    def get_project_by_id(self, project_id):
        """
        Fetch a complete project by ID including agents, tools, and interactions
        """
        conn = None
        cursor = None
        try:
            # Get project metadata
            conn = self.db.get_connection()
            cursor = conn.cursor(dictionary=True)
            
            # Get project details
            cursor.execute("SELECT id, name, version, description, created_at FROM projects WHERE id = %s", (project_id,))
            project = cursor.fetchone()
            
            if not project:
                return {"status": "error", "message": f"Project with ID {project_id} not found"}
            
            # Get agents for this project
            cursor.execute("SELECT * FROM agents WHERE project_id = %s", (project_id,))
            agents = cursor.fetchall()
            
            # Add position data for frontend visualization
            agents = [
                {
                    **agent, 
                    "position": {"x": 200 + i * 150, "y": 200 + (i % 3) * 100}
                } for i, agent in enumerate(agents)
            ]
            
            # Get tools for this project (if table exists)
            try:
                cursor.execute("SELECT * FROM tools WHERE project_id = %s", (project_id,))
                tools = cursor.fetchall()
                tools = [
                    {
                        **tool, 
                        "position": {"x": 200 + i * 100, "y": 500}
                    } for i, tool in enumerate(tools)
                ]
            except:
                tools = []
            
            # Get connections for this project (if table exists)
            try:
                cursor.execute("SELECT * FROM connections WHERE project_id = %s", (project_id,))
                connections = cursor.fetchall()
            except:
                connections = []
            
            # Format connections as interactions
            interactions = []
            for conn_data in connections:
                interactions.append({
                    "id": f"interaction-{conn_data['source']}-{conn_data['target']}",
                    "name": conn_data["label"] if conn_data.get("label") else f"Connection {conn_data['source']}-{conn_data['target']}",
                    "description": f"Connection between {conn_data['source']} and {conn_data['target']}",
                    "type": "AgentAgent",
                    "participants": [conn_data["source"], conn_data["target"]],
                    "protocol": {
                        "type": "DirectedMessaging",
                        "messageTypes": ["task"]
                    }
                })
            
            # Build complete project data
            return {
                "project": {
                    "id": project["id"],
                    "name": project["name"],
                    "version": project["version"],
                    "description": project["description"],
                    "created_at": project["created_at"]
                },
                "agents": agents,
                "tools": tools,
                "interactions": interactions,
                "connections": connections
            }
        
        except Exception as e:
            print(f"Error fetching project by ID: {str(e)}")
            return {"status": "error", "message": str(e)}
        
        finally:
            # Only close cursor and connection if they exist
            if cursor:
                cursor.close()
            if conn and hasattr(conn, 'close'):
                conn.close()