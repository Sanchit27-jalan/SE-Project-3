import { ProjectData, Agent, Tool } from '../models/types';
import { heartbeat } from './Heartbeat'; // Import the heartbeat service
import YAML from 'js-yaml';

export const API_BASE_URL = 'http://localhost:8000/api'; // Ensure this matches your backend URL

// Adapter interface and implementations for LD L formats
export interface FormatAdapter {
  serialize(data: any): string;
  deserialize(text: string): any;
}

export class JsonAdapter implements FormatAdapter {
  serialize(data: any): string {
    return JSON.stringify(data, null, 2);
  }
  deserialize(text: string): any {
    return JSON.parse(text);
  }
}

export class YamlAdapter implements FormatAdapter {
  serialize(data: any): string {
    return YAML.dump(data);
  }
  deserialize(text: string): any {
    return YAML.load(text);
  }
}

/**
 * Serialize project data into the chosen format (json or yaml)
 */
export function serializeLdl(data: any, format: 'json' | 'yaml'): string {
  const adapter = format === 'yaml' ? new YamlAdapter() : new JsonAdapter();
  return adapter.serialize(data);
}

/**
 * Deserialize raw text into project data object based on format
 */
export function deserializeLdl(text: string, format: 'json' | 'yaml'): any {
  const adapter = format === 'yaml' ? new YamlAdapter() : new JsonAdapter();
  return adapter.deserialize(text);
}

/**
 * Service for handling API communication with the backend
 */
export class ApiService {
  /**
   * Export project data to the backend in Lumos Definition Language format
   * This is for validated projects that will be executed
   */
  static async exportProject(
    lumosData: any
  ): Promise<{ success: boolean; runtimeUrl?: string; projectId?: string }> {
    try {
      // Pause the heartbeat
      heartbeat.pauseHeartbeat();

      const response = await fetch(`${API_BASE_URL}/export`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(lumosData),
      });

      if (!response.ok) {
        throw new Error('Failed to export project');
      }

      const result = await response.json();

      return {
        success: true,
        runtimeUrl: result.url || undefined,
        projectId: result.project_id || undefined,
      };
    } catch (error) {
      console.error('Error during export:', error);
      return { success: false };
    } finally {
      // Resume the heartbeat
      heartbeat.resumeHeartbeat();
    }
  }

  /**
   * Save project data to the backend without validation
   * This is for saving checkpoints during development
   */
  static async saveProject(lumosData: any): Promise<boolean> {
    // Pause the heartbeat
    heartbeat.pauseHeartbeat();
    try {
      // Create a deep copy to avoid modifying the original data
      const dataForSaving = JSON.parse(JSON.stringify(lumosData));
      
      // Remove position data from agents
      if (dataForSaving.agents) {
        dataForSaving.agents = dataForSaving.agents.map((agent: any) => {
          const { position, ...agentWithoutPosition } = agent;
          return agentWithoutPosition;
        });
      }
      
      // Remove position data from tools
      if (dataForSaving.tools) {
        dataForSaving.tools = dataForSaving.tools.map((tool: any) => {
          const { position, ...toolWithoutPosition } = tool;
          return toolWithoutPosition;
        });
      }

      // Transform the data to match the backend's ProjectSave schema
      const transformedData = {
        project: dataForSaving.project,
        agents: dataForSaving.agents,
        tools: dataForSaving.tools || [],
        interactions: dataForSaving.interactions || [],
        connections: (dataForSaving.interactions || [])
          .map((interaction: any) => {
            if (interaction.participants && interaction.participants.length >= 2) {
              return {
                id: interaction.id,
                source: interaction.participants[0],
                target: interaction.participants[1],
                label: interaction.name || '',
              };
            }
            return null;
          })
          .filter(Boolean),
      };

      const response = await fetch(`${API_BASE_URL}/save`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(transformedData),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }

      return true;
    } catch (error) {
      console.error('Error saving project:', error);
      return false;
    } finally {
      // Resume the heartbeat
      heartbeat.resumeHeartbeat();
    }
  }

  /**
   * Generate an agent based on a text prompt
   */
  static async generateAgent(prompt: string): Promise<{ success: boolean; agent?: any }> {
    try {
      const response = await fetch(`${API_BASE_URL}/generate_agent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ user_prompt: prompt }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return {
        success: true,
        agent: result.agent,
      };
    } catch (error) {
      console.error('Error generating agent:', error);
      return { success: false };
    }
  }

  /**
   * Generate a tool based on a text prompt
   */
  static async generateTool(prompt: string): Promise<{ success: boolean; tool?: any }> {
    try {
      const response = await fetch(`${API_BASE_URL}/generate_tool`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ user_prompt: prompt }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return {
        success: true,
        tool: result.tool,
      };
    } catch (error) {
      console.error('Error generating tool:', error);
      return { success: false };
    }
  }

  /**
   * Get all saved projects from the backend
   */
  static async getAllProjects(): Promise<any[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/projects`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch projects: ${response.statusText}`);
      }
      
      const data = await response.json();
      return data.projects || [];
    } catch (error) {
      console.error("Error fetching projects:", error);
      return [];
    }
  }

  /**
   * Get a specific project by ID from the backend
   */
  static async getProjectById(projectId: number): Promise<any> {
    try {
      const response = await fetch(`${API_BASE_URL}/projects/${projectId}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch project: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.status === "error" || !data.project) {
        throw new Error(data.message || "Failed to fetch project");
      }
      
      const projectData = data.project;
      
      // Ensure all agents have some initial position
      const agentsWithPositions = projectData.agents.map((agent: any, index: number) => ({
        ...agent,
        position: agent.position || { x: 200 + index * 50, y: 200 + index * 30 },
      }));
      
      // Apply Sugiyama layout if there are interactions
      let positionedAgents;
      if (projectData.interactions && projectData.interactions.length > 0) {
        positionedAgents = this.applySugiyamaLayout(
          agentsWithPositions,
          projectData.interactions
        );
      } else {
        positionedAgents = agentsWithPositions;
      }
      
      // Position tools (relative to their agents if assigned, or in default positions)
      const positionedTools = (projectData.tools || []).map(
        (tool: any, index: number) => {
          if (tool.agentId) {
            // Position the tool relative to its assigned agent if present
            const parentAgent = positionedAgents.find(
              (a: any) => a.id === tool.agentId
            );
            if (parentAgent) {
              return {
                ...tool,
                position: {
                  x: parentAgent.position.x + 50,
                  y: parentAgent.position.y + 150 + (index % 3) * 30,
                },
              };
            }
          }
          
          // Default position if no agent assigned
          return {
            ...tool,
            position: tool.position || {
              x: 300 + index * 50,
              y: 600 + index * 30,
            },
          };
        }
      );
      
      return {
        project: projectData.project,
        agents: positionedAgents,
        tools: positionedTools || [],
        interactions: projectData.interactions || [],
      };
    } catch (error) {
      console.error("Error fetching project details:", error);
      throw error;
    }
  }

  /**
   * Apply the Sugiyama Framework to position nodes in a graph
   * This algorithm arranges nodes in a layered approach to minimize edge crossings
   */
  private static applySugiyamaLayout(agents: any[], interactions: any[]): any[] {
    // Step 1: Build a directed graph representation
    const graph: Record<string, string[]> = {};
    const reverseGraph: Record<string, string[]> = {};

    // Initialize graphs
    agents.forEach(agent => {
      graph[agent.id] = [];
      reverseGraph[agent.id] = [];
    });

    // Populate edges
    interactions.forEach(interaction => {
      if (interaction.participants && interaction.participants.length >= 2) {
        const [source, target] = interaction.participants;
        if (graph[source] && !graph[source].includes(target)) {
          graph[source].push(target);
        }
        if (reverseGraph[target] && !reverseGraph[target].includes(source)) {
          reverseGraph[target].push(source);
        }
      }
    });

    // Step 2: Assign nodes to layers
    const layers: string[][] = [];
    const assigned = new Set<string>();

    // Find nodes with no incoming edges (start nodes, typically 'user-input')
    const startNodes = agents
      .filter(agent => reverseGraph[agent.id].length === 0)
      .map(agent => agent.id);

    if (startNodes.length === 0) {
      // If no clear starting node (could be a cycle), use user-input if it exists
      const userInput = agents.find(agent => agent.id === 'user-input');
      if (userInput) {
        startNodes.push('user-input');
      } else {
        // Just use the first node as a starting point
        startNodes.push(agents[0]?.id);
      }
    }

    // Perform a breadth-first traversal to assign layers
    let currentLayer = [...startNodes];

    while (currentLayer.length > 0) {
      layers.push(currentLayer);
      currentLayer.forEach(nodeId => assigned.add(nodeId));

      const nextLayer: string[] = [];

      for (const nodeId of currentLayer) {
        const children = graph[nodeId] || [];
        for (const child of children) {
          // Check if all parents of this child have been visited
          const parents = reverseGraph[child] || [];
          const allParentsAssigned = parents.every(p => assigned.has(p));

          if (allParentsAssigned && !assigned.has(child)) {
            nextLayer.push(child);
          }
        }
      }

      currentLayer = nextLayer;
    }

    // Handle nodes that weren't assigned due to cycles
    const unassignedNodes = agents.filter(agent => !assigned.has(agent.id)).map(agent => agent.id);

    if (unassignedNodes.length > 0) {
      layers.push(unassignedNodes); // Put them in a new layer
    }

    // Step 3: Calculate positions with improved layout
    const HORIZONTAL_SPACING = 280; // Increased spacing between columns
    const VERTICAL_SPACING = 140;   // Increased spacing between rows
    const CANVAS_WIDTH = 1200;      // Approximate canvas width
    const CANVAS_HEIGHT = 800;      // Approximate canvas height
    const CENTER_X = CANVAS_WIDTH / 2;
    const CENTER_Y = CANVAS_HEIGHT / 2;

    // Create a copy of agents with positions
    const positionedAgents = [...agents];
    
    // Find max layer size for vertical centering
    const maxLayerSize = Math.max(...layers.map(layer => layer.length));
    
    // First check if system nodes were already positioned by user
    const inputNode = positionedAgents.find((a) => a.id === "user-input");
    const outputNode = positionedAgents.find((a) => a.id === "user-output");
    
    // Store existing positions if already provided by the user
    const existingInputPosition = inputNode && inputNode.position && 
      (inputNode.position.x !== 0 && inputNode.position.y !== 0) ? 
      { ...inputNode.position } : null;
    
    const existingOutputPosition = outputNode && outputNode.position && 
      (outputNode.position.x !== 0 && outputNode.position.y !== 0) ? 
      { ...outputNode.position } : null;
    
    // Position each node with an improved algorithm
    layers.forEach((layer, layerIdx) => {
      const layerWidth = HORIZONTAL_SPACING;
      const totalLayersWidth = layers.length * HORIZONTAL_SPACING;
      
      // Start x-position for this layer, centered in canvas
      const layerX = CENTER_X - (totalLayersWidth / 2) + (layerIdx * HORIZONTAL_SPACING);
      
      // Calculate total height needed for this layer
      const layerHeight = layer.length * VERTICAL_SPACING;
      
      // Start y-position for this layer, centered in canvas
      const startY = CENTER_Y - (layerHeight / 2) + (VERTICAL_SPACING / 2);
      
      // Apply a radial layout pattern to avoid straight lines
      layer.forEach((nodeId, nodeIdx) => {
        const agent = positionedAgents.find(a => a.id === nodeId);
        if (agent) {
          // Skip positioning if this node has a user-defined position
          // This applies to any node that was manually positioned, not just system nodes
          if (agent.userPositioned || 
              (agent.id === "user-input" && existingInputPosition) || 
              (agent.id === "user-output" && existingOutputPosition)) {
            return;
          }
          
          // Calculate base position with horizontal distribution
          const x = layerX + (nodeIdx % 2 === 0 ? -40 : 40); // Increased zigzag effect
          const y = startY + (nodeIdx * VERTICAL_SPACING);
          
          // Add small random offset for more organic layout
          const offsetX = Math.floor(Math.random() * 40) - 20;
          const offsetY = Math.floor(Math.random() * 30) - 15;
          
          agent.position = { 
            x: x + offsetX,
            y: y + offsetY
          };
        }
      });
    });

    // Special positioning for user-input and user-output nodes ONLY if they don't have positions
    if (inputNode && !existingInputPosition) {
      const totalWidth = Math.max(1, (layers.length - 1)) * HORIZONTAL_SPACING;
      
      inputNode.position = { 
        x: CENTER_X - (totalWidth / 2) - 100, 
        y: CENTER_Y 
      };
    }
    
    if (outputNode && !existingOutputPosition) {
      const totalWidth = Math.max(1, (layers.length - 1)) * HORIZONTAL_SPACING;
      
      outputNode.position = { 
        x: CENTER_X + (totalWidth / 2) + 100, 
        y: CENTER_Y 
      };
    }

    return positionedAgents;
  }

  /**
   * Import a project from LDL data
   * Note: This is a client-side operation and doesn't make an API call
   */
  static processImportedData(data: any): ProjectData | null {
    try {
      // Define default positions, but we'll use Sugiyama layout if there are interactions
      const defaultPositionedAgents = data.agents.map((agent: Agent, index: number) => ({
        ...agent,
        position: agent.position || {
          x: 200 + index * 50,
          y: 200 + index * 30,
        },
      }));

      // Apply Sugiyama layout if there are interactions
      let positionedAgents;
      if (data.interactions && data.interactions.length > 0) {
        positionedAgents = this.applySugiyamaLayout(defaultPositionedAgents, data.interactions);
      } else {
        positionedAgents = defaultPositionedAgents;
      }

      // Position tools (relative to their agents if assigned, or in default positions)
      const positionedTools = (data.tools || []).map((tool: Tool, index: number) => {
        if (tool.agentId) {
          // Position the tool relative to its assigned agent if present
          const parentAgent = positionedAgents.find((a: { id: string }) => a.id === tool.agentId);
          if (parentAgent) {
            return {
              ...tool,
              position: {
                x: parentAgent.position.x + 50,
                y: parentAgent.position.y + 150 + (index % 3) * 30,
              },
            };
          }
        }

        // Default position if no agent assigned
        return {
          ...tool,
          position: tool.position || {
            x: 300 + index * 50,
            y: 600 + index * 30,
          },
        };
      });

      return {
        project: data.project,
        agents: positionedAgents,
        tools: positionedTools,
        interactions: data.interactions || [],
      };
    } catch (error) {
      console.error('Error processing import data:', error);
      return null;
    }
  }
}
