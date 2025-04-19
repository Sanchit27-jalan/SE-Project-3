from .project_storage_strategy import ProjectStorageStrategy
from .database import Database
import json  # Add this import

from mysql.connector import Error
##typeof import

import json

class SQLProjectStorage(ProjectStorageStrategy):
    def __init__(self):
        self.db = Database()

    def create_project(self, project_data):
        conn = self.db.get_connection()
        cursor = conn.cursor(dictionary=True)
        
        try:
            # Insert project
            cursor.execute("""
                INSERT INTO projects (name, version, description)
                VALUES (%s, %s, %s)
            """, (project_data['project']['name'], 
                  project_data['project']['version'], 
                  project_data['project']['description']))
            project_id = cursor.lastrowid
            
            # Insert authors
            for author in project_data['project'].get('authors', []):
                cursor.execute("""
                    INSERT INTO authors (project_id, name)
                    VALUES (%s, %s)
                """, (project_id, author))
            
            # Insert agents
            for agent in project_data.get('agents', []):
                cursor.execute("""
                    INSERT INTO agents (project_id, agent_id, name, description, type, subtype)
                    VALUES (%s, %s, %s, %s, %s, %s)
                """, (project_id, agent['id'], agent['name'], agent['description'], 
                      agent['type'], agent.get('subtype', '')))
                agent_id = cursor.lastrowid
                
                # Insert agent model if exists
                if agent.get('model'):
                    cursor.execute("""
                        INSERT INTO agent_models (agent_id, name, version, provider, parameters)
                        VALUES (%s, %s, %s, %s, %s)
                    """, (agent_id, agent['model'].get('name', ''), 
                          agent['model'].get('version', 'latest'),
                          agent['model'].get('provider', ''),
                          str(agent['model'].get('parameters', {}))))
                
                # Insert agent capabilities
                for capability in agent.get('capabilities', []):
                    cursor.execute("""
                        INSERT INTO agent_capabilities (agent_id, capability)
                        VALUES (%s, %s)
                    """, (agent_id, capability))
                
                # Insert agent tools
                for tool in agent.get('tools', []):
                    cursor.execute("""
                        INSERT INTO agent_tools (agent_id, name, description, type, subtype, parameters)
                        VALUES (%s, %s, %s, %s, %s, %s)
                    """, (agent_id, tool['name'], tool['description'], 
                          tool['type'], tool.get('subtype', ''),
                          str(tool.get('parameters', {}))))
            
            # Insert interactions
            for interaction in project_data.get('interactions', []):
                cursor.execute("""
                    INSERT INTO interactions (project_id, interaction_id, type, subtype, pattern)
                    VALUES (%s, %s, %s, %s, %s)
                """, (project_id, interaction['id'], interaction['type'], 
                      interaction.get('subtype', ''), interaction.get('pattern', '')))
                
                interaction_id = cursor.lastrowid
                
                # Insert participants
                for participant in interaction.get('participants', []):
                    cursor.execute("""
                        INSERT INTO interaction_participants (interaction_id, agent_id)
                        VALUES (%s, %s)
                    """, (interaction_id, participant))
                
                # Insert protocol
                if interaction.get('protocol'):
                    cursor.execute("""
                        INSERT INTO interaction_protocols (interaction_id, type, message_types)
                        VALUES (%s, %s, %s)
                    """, (interaction_id, interaction['protocol']['type'],
                          str(interaction['protocol'].get('messageTypes', []))))
            
            conn.commit()
            return {"status": "success", "project_id": project_id}
            
        except Exception as e:
            conn.rollback()
            return {"status": "error", "message": str(e)}
        finally:
            cursor.close()
            
            
    def save_project(self, project_data):
        print("Saving project data...")
        print(project_data)
        conn = self.db.get_connection()
        cursor = conn.cursor(dictionary=True)
        
        try:
            # First check if project exists
            cursor.execute("SELECT id FROM projects WHERE name = %s", 
                        (project_data['project']['name'],))
            project = cursor.fetchone()
            
            if project:
                project_id = project['id']
                # Update existing project
                cursor.execute("""
                    UPDATE projects 
                    SET version = %s, description = %s 
                    WHERE id = %s
                """, (project_data['project']['version'],
                    project_data['project']['description'],
                    project_id))
                
                # Delete existing data to replace with new data
                cursor.execute("DELETE FROM authors WHERE project_id = %s", (project_id,))
                cursor.execute("DELETE FROM agents WHERE project_id = %s", (project_id,))
                cursor.execute("DELETE FROM tools WHERE project_id = %s", (project_id,))
                cursor.execute("DELETE FROM tasks WHERE project_id = %s", (project_id,))
                cursor.execute("DELETE FROM connections WHERE project_id = %s", (project_id,))
            else:
                # Insert new project
                cursor.execute("""
                    INSERT INTO projects (name, version, description)
                    VALUES (%s, %s, %s)
                """, (project_data['project']['name'],
                    project_data['project']['version'],
                    project_data['project']['description']))
                project_id = cursor.lastrowid
            
            # Insert authors
            for author in project_data['project'].get('authors', []):
                cursor.execute("""
                    INSERT INTO authors (project_id, name)
                    VALUES (%s, %s)
                """, (project_id, author))
            
            # Insert agents with positions
            for agent in project_data.get('agents', []):
                cursor.execute("""
                    INSERT INTO agents (project_id, agent_id, name, description, 
                                    type, subtype, position_x, position_y)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                """, (project_id, agent['id'], agent['name'], agent['description'],
                    agent['type'], agent.get('subtype', ''),
                    agent['position']['x'], agent['position']['y']))
                
                agent_id = cursor.lastrowid
                
                # Insert agent model if exists
                if agent.get('model'):
                    cursor.execute("""
                        INSERT INTO agent_models (agent_id, llm_type, model_name, 
                                            model_version, provider, parameters)
                        VALUES (%s, %s, %s, %s, %s, %s)
                    """, (agent_id, 
                        agent['model'].get('llmType', ''),
                        agent['model'].get('name', ''),
                        agent['model'].get('version', 'latest'),
                        agent['model'].get('provider', ''),
                        json.dumps(agent['model'].get('parameters', {}))))
                
                # Insert agent capabilities
                for capability in agent.get('capabilities', []):
                    cursor.execute("""
                        INSERT INTO agent_capabilities (agent_id, capability)
                        VALUES (%s, %s)
                    """, (agent_id, capability))
            
            # Insert tools with positions
            for tool in project_data.get('tools', []):
                cursor.execute("""
                    INSERT INTO tools (project_id, tool_id, name, description,
                                    type, subtype, position_x, position_y)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                """, (project_id, tool['id'], tool['name'], tool['description'],
                    tool['type'], tool.get('subtype', ''),
                    tool['position']['x'], tool['position']['y']))
                
                tool_id = cursor.lastrowid
                
                # Insert tool parameters
                if tool.get('parameters'):
                    for param_name, param_value in tool['parameters'].items():
                        cursor.execute("""
                            INSERT INTO tool_parameters (tool_id, param_name, param_type,
                                                    default_value, required)
                            VALUES (%s, %s, %s, %s, %s)
                        """, (tool_id, param_name, typeof(param_value),
                            str(param_value), True))
            
            # Insert tasks with positions
            for task in project_data.get('tasks', []):
                cursor.execute("""
                    INSERT INTO tasks (project_id, task_id, name, description,
                                    type, position_x, position_y)
                    VALUES (%s, %s, %s, %s, %s, %s, %s)
                """, (project_id, task['id'], task['name'], task['description'],
                    task['type'], task['position']['x'], task['position']['y']))
                
                task_id = cursor.lastrowid
                
                # Insert task parameters
                if task.get('parameters'):
                    for param_name, param_value in task['parameters'].items():
                        cursor.execute("""
                            INSERT INTO task_parameters (task_id, param_name, param_type,
                                                    default_value, required)
                            VALUES (%s, %s, %s, %s, %s)
                        """, (task_id, param_name, typeof(param_value),
                            str(param_value), True))
            
            # Insert connections
            for connection in project_data.get('connections', []):
                cursor.execute("""
                    INSERT INTO connections (project_id, connection_id, source_type,
                                        source_id, target_type, target_id, label)
                    VALUES (%s, %s, %s, %s, %s, %s, %s)
                """, (project_id, connection['id'], 'agent',  # You'll need to determine source/target types
                    connection['source'], 'agent', connection['target'],  # Adjust as needed
                    connection.get('label', '')))
            
            print("Project saved successfully")
            conn.commit()
            return {"status": "success", "project_id": project_id}
        
        except Exception as e:
            conn.rollback()
            return {"status": "error", "message": str(e)}
        finally:
            cursor.close()