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
        """Save a project to the database"""
        try:
            conn = self.db.get_connection()
            cursor = conn.cursor()
            
            try:
                # Start transaction
                conn.start_transaction()
                
                # Save project
                project = project_data.get('project', {})
                project_name = project.get('name', 'Untitled Project')
                project_version = project.get('version', '1.0')
                project_description = project.get('description', '')
                
                # Insert project
                cursor.execute(
                    "INSERT INTO projects (name, version, description) VALUES (%s, %s, %s)",
                    (project_name, project_version, project_description)
                )
                project_id = cursor.lastrowid
                
                # ID mapping for special agents
                id_mapping = {
                    'user-input': 0,
                    'user-output': 1
                }
                
                # Save agents WITHOUT position data
                for agent in project_data.get('agents', []):
                    # Remove position data if it exists
                    if 'position' in agent:
                        del agent['position']
                    
                    # Get the original agent ID
                    agent_id = agent.get('id', '')
                    
                    cursor.execute(
                        "INSERT INTO agents (agent_id, project_id, name, description, type, subtype) VALUES (%s, %s, %s, %s, %s, %s)",
                        (
                            agent_id,  # Use original string ID
                            project_id,
                            agent.get('name', ''),
                            agent.get('description', ''),
                            agent.get('type', ''),
                            agent.get('subtype', '')
                        )
                    )
                
                # Save tools WITHOUT position data
                for tool in project_data.get('tools', []):
                    # Remove position data if it exists
                    if 'position' in tool:
                        del tool['position']
                    
                    # Similar ID handling for tools if needed
                    tool_id = tool.get('id', '')
                    try:
                        if tool_id.startswith('tool-'):
                            numeric_id = int(tool_id.split('-')[1])
                        else:
                            numeric_id = 20000 + hash(tool_id) % 10000
                    except:
                        numeric_id = 20000  # Default if parsing fails
                    
                    cursor.execute(
                        "INSERT INTO tools (id, project_id, name, description, type) VALUES (%s, %s, %s, %s, %s)",
                        (
                            numeric_id,
                            project_id,
                            tool.get('name', ''),
                            tool.get('description', ''),
                            tool.get('type', '')
                        )
                    )
                
                # Save connections with unique IDs
                used_connection_ids = set()  # Track used IDs to prevent duplicates
                for connection in project_data.get('connections', []):
                    conn_id = connection.get('id', '')
                    
                    # Generate a numeric ID based on the string ID
                    base_numeric_id = abs(hash(conn_id)) % 1000000
                    numeric_conn_id = base_numeric_id
                    
                    # If ID collision, keep incrementing until we find an unused ID
                    counter = 1
                    while numeric_conn_id in used_connection_ids:
                        numeric_conn_id = base_numeric_id + counter
                        counter += 1
                    
                    # Add to used IDs set
                    used_connection_ids.add(numeric_conn_id)
                    
                    # Map source and target IDs (keep existing code)
                    source = connection.get('source', '')
                    target = connection.get('target', '')
                    
                    # Keep the existing source/target ID mapping logic
                    source_id = source  # Use string IDs directly
                    target_id = target  # Use string IDs directly
                    
                    cursor.execute(
                        "INSERT INTO connections (id, project_id, source, target, label) VALUES (%s, %s, %s, %s, %s)",
                        (
                            numeric_conn_id,
                            project_id,
                            source_id,  # Use string IDs
                            target_id,  # Use string IDs
                            connection.get('label', '')
                        )
                    )
                
                # Commit transaction
                conn.commit()
                return {"status": "success", "project_id": project_id}
                
            except Exception as e:
                conn.rollback()
                raise e
                
        except Exception as e:
            return {"status": "error", "message": str(e)}
        finally:
            if 'conn' in locals() and conn.is_connected():
                cursor.close()
                conn.close()