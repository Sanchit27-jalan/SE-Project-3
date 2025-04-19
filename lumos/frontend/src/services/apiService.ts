import { ProjectData, Agent, Tool } from "../models/types";
import { heartbeat } from "./Heartbeat"; // Import the heartbeat service
import YAML from "js-yaml";

export const API_BASE_URL = "http://localhost:8000/api"; // Ensure this matches your backend URL

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
export function serializeLdl(data: any, format: "json" | "yaml"): string {
  const adapter = format === "yaml" ? new YamlAdapter() : new JsonAdapter();
  return adapter.serialize(data);
}

/**
 * Deserialize raw text into project data object based on format
 */
export function deserializeLdl(text: string, format: "json" | "yaml"): any {
  const adapter = format === "yaml" ? new YamlAdapter() : new JsonAdapter();
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
    lumosData: any,
  ): Promise<{ success: boolean; runtimeUrl?: string; projectId?: string }> {
    try {
      // Pause the heartbeat
      heartbeat.pauseHeartbeat();

      const response = await fetch(`${API_BASE_URL}/export`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(lumosData),
      });

      if (!response.ok) {
        throw new Error("Failed to export project");
      }

      const result = await response.json();

      return {
        success: true,
        runtimeUrl: result.url || undefined,
        projectId: result.project_id || undefined,
      };
    } catch (error) {
      console.error("Error during export:", error);
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
      // Transform the data to match the backend's ProjectSave schema
      const transformedData = {
        project: lumosData.project,
        agents: lumosData.agents.map((agent: any) => ({
          ...agent,
          position: agent.position || { x: 0, y: 0 },
        })),
        tools: (lumosData.tools || []).map((tool: any) => ({
          ...tool,
          position: tool.position || { x: 0, y: 0 },
        })),
        tasks: [], // Not used in current frontend but required by backend
        // Convert interactions to connections format
        connections: (lumosData.interactions || [])
          .map((interaction: any) => {
            if (
              interaction.participants &&
              interaction.participants.length >= 2
            ) {
              return {
                id: interaction.id,
                source: interaction.participants[0],
                target: interaction.participants[1],
                label: interaction.name || "",
              };
            }
            return null;
          })
          .filter(Boolean),
      };

      const response = await fetch(`${API_BASE_URL}/save`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(transformedData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return true;
    } catch (error) {
      console.error("Error saving project:", error);
      return false;
    } finally {
      // Resume the heartbeat
      heartbeat.resumeHeartbeat();
    }
  }

  /**
   * Generate an agent based on a text prompt
   */
  static async generateAgent(
    prompt: string,
  ): Promise<{ success: boolean; agent?: any }> {
    try {
      const response = await fetch(`${API_BASE_URL}/generate_agent`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
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
      console.error("Error generating agent:", error);
      return { success: false };
    }
  }

  /**
   * Generate a tool based on a text prompt
   */
  static async generateTool(
    prompt: string,
  ): Promise<{ success: boolean; tool?: any }> {
    try {
      const response = await fetch(`${API_BASE_URL}/generate_tool`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
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
      console.error("Error generating tool:", error);
      return { success: false };
    }
  }

  /**
   * Apply the Sugiyama Framework to position nodes in a graph
   * This algorithm arranges nodes in a layered approach to minimize edge crossings
   */
  private static applySugiyamaLayout(
    agents: any[],
    interactions: any[],
  ): any[] {
    // Step 1: Build a directed graph representation
    const graph: Record<string, string[]> = {};
    const reverseGraph: Record<string, string[]> = {};

    // Initialize graphs
    agents.forEach((agent) => {
      graph[agent.id] = [];
      reverseGraph[agent.id] = [];
    });

    // Populate edges
    interactions.forEach((interaction) => {
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
    // const visited = new Set<string>();
    const assigned = new Set<string>();

    // Find nodes with no incoming edges (start nodes, typically 'user-input')
    const startNodes = agents
      .filter((agent) => reverseGraph[agent.id].length === 0)
      .map((agent) => agent.id);

    if (startNodes.length === 0) {
      // If no clear starting node (could be a cycle), use user-input if it exists
      const userInput = agents.find((agent) => agent.id === "user-input");
      if (userInput) {
        startNodes.push("user-input");
      } else {
        // Just use the first node as a starting point
        startNodes.push(agents[0]?.id);
      }
    }

    // Perform a breadth-first traversal to assign layers
    let currentLayer = [...startNodes];

    while (currentLayer.length > 0) {
      layers.push(currentLayer);
      currentLayer.forEach((nodeId) => assigned.add(nodeId));

      const nextLayer: string[] = [];

      for (const nodeId of currentLayer) {
        const children = graph[nodeId] || [];
        for (const child of children) {
          // Check if all parents of this child have been visited
          const parents = reverseGraph[child] || [];
          const allParentsAssigned = parents.every((p) => assigned.has(p));

          if (allParentsAssigned && !assigned.has(child)) {
            nextLayer.push(child);
          }
        }
      }

      currentLayer = nextLayer;
    }

    // Handle nodes that weren't assigned due to cycles
    const unassignedNodes = agents
      .filter((agent) => !assigned.has(agent.id))
      .map((agent) => agent.id);

    if (unassignedNodes.length > 0) {
      layers.push(unassignedNodes); // Put them in a new layer
    }

    // Step 3: Calculate positions based on layers
    const HORIZONTAL_SPACING = 250; // Space between columns
    const VERTICAL_SPACING = 120; // Space between nodes in the same column
    // const NODE_HEIGHT = 100;        // Estimated height of a node

    // Calculate vertical center position based on total height of each layer
    const positionedAgents = [...agents];

    layers.forEach((layer, layerIdx) => {
      // const layerHeight = layer.length * (VERTICAL_SPACING);

      layer.forEach((nodeId, nodeIdx) => {
        const agent = positionedAgents.find((a) => a.id === nodeId);
        if (agent) {
          const x = 100 + layerIdx * HORIZONTAL_SPACING;
          const y = 100 + (nodeIdx * VERTICAL_SPACING + VERTICAL_SPACING / 2);

          agent.position = { x, y };
        }
      });
    });

    // Special positions for user-input and user-output if they exist
    const inputNode = positionedAgents.find((a) => a.id === "user-input");
    const outputNode = positionedAgents.find((a) => a.id === "user-output");

    if (inputNode && outputNode) {
      inputNode.position = { x: 100, y: 300 };
      outputNode.position = {
        x: 100 + layers.length * HORIZONTAL_SPACING,
        y: 300,
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
      const defaultPositionedAgents = data.agents.map(
        (agent: Agent, index: number) => ({
          ...agent,
          position: agent.position || {
            x: 200 + index * 50,
            y: 200 + index * 30,
          },
        }),
      );

      // Apply Sugiyama layout if there are interactions
      let positionedAgents;
      if (data.interactions && data.interactions.length > 0) {
        positionedAgents = this.applySugiyamaLayout(
          defaultPositionedAgents,
          data.interactions,
        );
      } else {
        positionedAgents = defaultPositionedAgents;
      }

      // Position tools (relative to their agents if assigned, or in default positions)
      const positionedTools = (data.tools || []).map(
        (tool: Tool, index: number) => {
          if (tool.agentId) {
            // Position the tool relative to its assigned agent if present
            const parentAgent = positionedAgents.find(
              (a: { id: string }) => a.id === tool.agentId,
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
        },
      );

      return {
        project: data.project,
        agents: positionedAgents,
        tools: positionedTools,
        interactions: data.interactions || [],
      };
    } catch (error) {
      console.error("Error processing import data:", error);
      return null;
    }
  }
}
