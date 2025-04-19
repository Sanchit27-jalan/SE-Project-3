import {
  Project,
  ProjectData,
  Agent,
  Tool,
  Interaction,
  Position,
} from "../models/types";
import { ApiService } from "../services/apiService";
import { serializeLdl, deserializeLdl } from "../services/apiService";
import { CanvasObjectFactory } from "../models/CanvasObjectFactory";

/**
 * Controller for managing project data and operations
 */
export class ProjectController {
  private projectData: ProjectData;
  private onProjectChanged: (project: ProjectData) => void;

  constructor(onProjectChanged: (project: ProjectData) => void) {
    // Initialize with default project
    this.projectData = new ProjectData(
      new Project("New Project", "1.0.0", "A new agent orchestration project"),
    );

    // Add default input/output nodes
    this.addDefaultNodes();

    this.onProjectChanged = onProjectChanged;
  }

  /**
   * Add default input and output nodes to the project
   */
  private addDefaultNodes(): void {
    // Add user input node using the factory
    const inputAgent = CanvasObjectFactory.createUserInputAgent();

    // Add user output node using the factory
    const outputAgent = CanvasObjectFactory.createUserOutputAgent();

    this.projectData.agents.push(inputAgent, outputAgent);
  }

  /**
   * Get the current project data
   */
  getProjectData(): ProjectData {
    return this.projectData;
  }

  /**
   * Update project metadata
   */
  updateProject(project: Project): void {
    this.projectData.project = project;
    this.notifyChange();
  }

  /**
   * Add a new agent to the project
   */
  addAgent(agent: Agent): void {
    // Ensure unique ID
    agent.id = agent.id || `agent-${Date.now()}`;

    // Add default position if not specified
    if (!agent.position || (agent.position.x === 0 && agent.position.y === 0)) {
      agent.position = {
        x: 200 + this.projectData.agents.length * 50,
        y: 200 + this.projectData.agents.length * 30,
      };
    }

    this.projectData.agents.push(agent);
    this.notifyChange();
  }

  /**
   * Add a new tool to the project
   */
  addTool(tool: Tool): void {
    // Ensure unique ID
    tool.id = tool.id || `tool-${Date.now()}`;

    this.projectData.tools.push(tool);
    this.notifyChange();
  }

  /**
   * Add an interaction between agents
   */
  addInteraction(sourceId: string, targetId: string): void {
    // Validate interaction
    const source = this.findNodeById(sourceId);
    const target = this.findNodeById(targetId);

    if (!source || !target) {
      console.error(
        "Cannot create interaction: Source or target node not found",
      );
      return;
    }

    // Check if the target is a user output node - enforce single input
    if (target.id === "user-output") {
      // Check if user-output already has an incoming connection
      const hasExistingConnection = this.projectData.interactions.some(
        (interaction) =>
          interaction.participants.length >= 2 &&
          interaction.participants[1] === "user-output",
      );

      if (hasExistingConnection) {
        console.error("User Output node can only have a single input");
        return;
      }
    }

    // Create interaction
    const interactionId = `interaction-${sourceId}-${targetId}`;

    // Check if interaction already exists
    const existingInteraction = this.projectData.interactions.find(
      (interaction) => interaction.id === interactionId,
    );

    if (existingInteraction) {
      console.log("Interaction already exists");
      return;
    }

    const interaction = new Interaction(
      interactionId,
      `Connection ${sourceId}-${targetId}`,
      `Connection between ${sourceId} and ${targetId}`,
      "AgentAgent",
      [sourceId, targetId],
      { type: "DirectedMessaging", messageTypes: ["task"] },
    );

    this.projectData.interactions.push(interaction);
    this.notifyChange();
  }

  /**
   * Remove an agent from the project
   */
  removeAgent(agentId: string): void {
    // Don't remove system agents (user input/output)
    if (agentId === "user-input" || agentId === "user-output") {
      console.warn("Cannot remove system agents");
      return;
    }

    // Remove the agent
    this.projectData.agents = this.projectData.agents.filter(
      (agent) => agent.id !== agentId,
    );

    // Remove associated interactions
    this.projectData.interactions = this.projectData.interactions.filter(
      (interaction) => !interaction.participants.includes(agentId),
    );

    // Remove associated tools or update them
    this.projectData.tools = this.projectData.tools.filter(
      (tool) => tool.agentId !== agentId,
    );

    this.notifyChange();
  }

  /**
   * Remove a tool from the project
   */
  removeTool(toolId: string): void {
    this.projectData.tools = this.projectData.tools.filter(
      (tool) => tool.id !== toolId,
    );
    this.notifyChange();
  }

  /**
   * Remove an interaction
   */
  removeInteraction(interactionId: string): void {
    this.projectData.interactions = this.projectData.interactions.filter(
      (interaction) => interaction.id !== interactionId,
    );
    this.notifyChange();
  }

  /**
   * Update the position of a node
   */
  updateNodePosition(nodeId: string, position: Position): void {
    // Try to find the node in agents
    const agent = this.projectData.agents.find((a) => a.id === nodeId);
    if (agent) {
      agent.position = position;
      this.notifyChange();
      return;
    }
  }

  /**
   * Associate a tool with an agent
   */
  assignToolToAgent(toolId: string, agentId: string): void {
    const tool = this.projectData.tools.find((t) => t.id === toolId);
    if (tool) {
      tool.agentId = agentId;
      this.notifyChange();
    }
  }

  /**
   * Find an agent by its ID
   */
  private findNodeById(nodeId: string): Agent | undefined {
    return this.projectData.agents.find((a) => a.id === nodeId);
  }

  /**
   * Validate the project to ensure it meets requirements
   * 1. Has user input and output nodes
   * 2. User output has exactly one input
   * 3. There's a path from user input to user output
   */
  validateProject(): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check for user input and output nodes
    const hasInputNode = this.projectData.agents.some(
      (a) => a.id === "user-input",
    );
    const hasOutputNode = this.projectData.agents.some(
      (a) => a.id === "user-output",
    );

    if (!hasInputNode) {
      errors.push(
        "Project must have a User Input node to receive user requests",
      );
    }

    if (!hasOutputNode) {
      errors.push(
        "Project must have a User Output node to display responses to the user",
      );
    }

    // Check if user output has exactly one input
    if (hasOutputNode) {
      const outputNodeInputs = this.projectData.interactions.filter(
        (interaction) =>
          interaction.participants.length >= 2 &&
          interaction.participants[1] === "user-output",
      );

      if (outputNodeInputs.length === 0) {
        errors.push(
          "User Output node must have at least one input connection. Add a connection from an agent to the User Output node.",
        );
      } else if (outputNodeInputs.length > 1) {
        errors.push(
          `User Output node has ${outputNodeInputs.length} input connections, but must have exactly one. Remove additional connections to ensure a clean response format.`,
        );
      }
    }

    // Check if there's a path from user input to user output
    if (hasInputNode && hasOutputNode) {
      const pathExists = this.checkPathExists(
        "user-input",
        "user-output",
        new Set(),
      );
      if (!pathExists) {
        errors.push(
          "There must be a path from User Input to User Output. Create a series of connections to establish this flow.",
        );
      }
    }

    // Check for orphaned nodes (agents without any connections)
    const connectedNodeIds = new Set<string>();

    this.projectData.interactions.forEach((interaction) => {
      if (interaction.participants.length >= 2) {
        connectedNodeIds.add(interaction.participants[0]);
        connectedNodeIds.add(interaction.participants[1]);
      }
    });

    const orphanedAgents = this.projectData.agents.filter(
      (agent) =>
        !connectedNodeIds.has(agent.id) &&
        agent.id !== "user-input" &&
        agent.id !== "user-output",
    );

    if (orphanedAgents.length > 0) {
      const orphanedNames = orphanedAgents.map((a) => `"${a.name}"`).join(", ");
      warnings.push(
        `Found ${orphanedAgents.length} orphaned agent(s): ${orphanedNames}. These agents have no connections and won't be utilized.`,
      );
    }

    // Check for agents with only input connections but no output
    const agentsWithOnlyInputs = this.projectData.agents
      .filter(
        (agent) => agent.id !== "user-output" && agent.id !== "user-input",
      )
      .filter((agent) => {
        const hasInputs = this.projectData.interactions.some(
          (interaction) => interaction.participants[1] === agent.id,
        );
        const hasOutputs = this.projectData.interactions.some(
          (interaction) => interaction.participants[0] === agent.id,
        );
        return hasInputs && !hasOutputs;
      });

    if (agentsWithOnlyInputs.length > 0) {
      const deadEndNames = agentsWithOnlyInputs
        .map((a) => `"${a.name}"`)
        .join(", ");
      warnings.push(
        `Found ${agentsWithOnlyInputs.length} agent(s) that receive input but don't send output: ${deadEndNames}. This creates dead ends in your workflow.`,
      );
    }

    // Check for cycles in the graph which could cause infinite loops
    const hasCycles = this.detectCycles();
    if (hasCycles) {
      errors.push(
        "Your agent system contains cycles (A→B→C→A). This cause infinite processing loop and should be avoided. Please check your connections.",
      );
    }

    return { isValid: errors.length === 0, errors, warnings };
  }

  /**
   * Check if a path exists between two nodes using DFS
   */
  private checkPathExists(
    startNodeId: string,
    endNodeId: string,
    visited: Set<string>,
  ): boolean {
    if (startNodeId === endNodeId) {
      return true; // Path found
    }

    visited.add(startNodeId);

    // Find all outgoing edges
    const outgoingEdges = this.projectData.interactions.filter(
      (interaction) => interaction.participants[0] === startNodeId,
    );

    for (const edge of outgoingEdges) {
      const nextNodeId = edge.participants[1];
      if (
        !visited.has(nextNodeId) &&
        this.checkPathExists(nextNodeId, endNodeId, visited)
      ) {
        return true;
      }
    }

    visited.delete(startNodeId);
    return false; // No path found
  }

  /**
   * Detect cycles in the graph using DFS
   */
  private detectCycles(): boolean {
    const visited = new Set<string>();
    const recursionStack = new Set<string>();

    const dfs = (nodeId: string): boolean => {
      if (recursionStack.has(nodeId)) {
        return true; // Cycle detected
      }

      if (visited.has(nodeId)) {
        return false;
      }

      visited.add(nodeId);
      recursionStack.add(nodeId);

      // Find all outgoing edges
      const outgoingEdges = this.projectData.interactions.filter(
        (interaction) => interaction.participants[0] === nodeId,
      );

      for (const edge of outgoingEdges) {
        const nextNodeId = edge.participants[1];
        if (dfs(nextNodeId)) {
          return true;
        }
      }

      recursionStack.delete(nodeId);
      return false;
    };

    // Start DFS from each node that hasn't been visited
    for (const agent of this.projectData.agents) {
      if (!visited.has(agent.id) && dfs(agent.id)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Export the project to the backend with validation
   */
  async exportProject(): Promise<
    | boolean
    | {
        success: boolean;
        runtimeUrl?: string;
        errors?: string[];
        warnings?: string[];
      }
  > {
    // Validate the project first
    const { isValid, errors, warnings } = this.validateProject();

    if (!isValid) {
      console.error("Project validation failed:", errors);
      return {
        success: false,
        errors,
        warnings,
      };
    } else if (warnings.length > 0) {
      console.warn("Project validation warnings:", warnings);
    }
    console.log("Project validation passed");

    // Convert to LDL and export
    const ldlData = this.convertToLDL();
    const result = await ApiService.exportProject(ldlData);

    console.log("Export result:", result);

    if (typeof result === "object") {
      return result;
    }

    return { success: result };
  }

  /**
   * Convert project data to LDL format
   */
  private convertToLDL(): any {
    // Clean up any positions - LDL doesn't need position data
    const agents = this.projectData.agents.map((agent) => {
      // Create a clean copy without position
      const { position, ...cleanAgent } = agent;
      return cleanAgent;
    });

    const tools = this.projectData.tools.map((tool) => {
      // Create a clean copy without position
      const { position, ...cleanTool } = tool;
      return cleanTool;
    });

    return {
      project: this.projectData.project,
      agents,
      tools,
      interactions: this.projectData.interactions,
    };
  }

  /**
   * Save the project to the backend without validation
   */
  async saveProject(): Promise<boolean> {
    // Convert to LDL and save
    const ldlData = this.convertToLDL();
    return await ApiService.saveProject(ldlData);
  }

  /**
   * Import project from LDL JSON
   */
  async importFromLDL(ldlData: any): Promise<boolean> {
    try {
      // Validate basic LDL structure
      if (!ldlData.project || !ldlData.agents) {
        throw new Error("Invalid LDL data: Missing required fields");
      }

      // Check for user input and output nodes
      const hasInputNode = ldlData.agents.some(
        (a: any) => a.id === "user-input",
      );
      const hasOutputNode = ldlData.agents.some(
        (a: any) => a.id === "user-output",
      );

      if (!hasInputNode || !hasOutputNode) {
        // Add missing nodes
        if (!hasInputNode) {
          ldlData.agents.push({
            id: "user-input",
            type: "System",
            name: "User Input",
            description: "Entry point for user requests",
            subtype: "input",
            capabilities: ["input-processing"],
            memory: { type: "short-term" },
            learning: { type: "none" },
          });
        }

        if (!hasOutputNode) {
          ldlData.agents.push({
            id: "user-output",
            type: "System",
            name: "User Output",
            description: "Exit point for system responses",
            subtype: "output",
            capabilities: ["output-processing"],
            memory: { type: "short-term" },
            learning: { type: "none" },
          });
        }
      }

      // Process the imported data using the revised apiService method
      const processedData = ApiService.processImportedData(ldlData);

      if (!processedData) {
        throw new Error("Failed to process import data");
      }

      // Replace existing project data with imported data
      this.projectData = processedData;
      this.notifyChange();
      return true;
    } catch (error) {
      console.error("Error importing LDL data:", error);
      return false;
    }
  }

  /**
   * Export project data to a string in JSON or YAML
   */
  exportAs(format: "json" | "yaml"): string {
    // Convert to LDL object
    const ldl = this.convertToLDL();
    return serializeLdl(ldl, format);
  }

  /**
   * Import project data from a string (JSON or YAML)
   */
  async importFromText(
    text: string,
    format: "json" | "yaml",
  ): Promise<boolean> {
    try {
      const ldlData = deserializeLdl(text, format);
      return await this.importFromLDL(ldlData);
    } catch (err) {
      console.error("Error parsing import text:", err);
      return false;
    }
  }

  /**
   * Clear all objects on the canvas except user input/output nodes
   */
  public clearCanvas(): void {
    // Keep only system agents
    this.projectData.agents = this.projectData.agents.filter(
      (agent) => agent.id === 'user-input' || agent.id === 'user-output'
    );
    // Remove all tools and interactions
    this.projectData.tools = [];
    this.projectData.interactions = [];
    this.notifyChange();
  }

  /**
   * Notify subscribers that the project has changed
   */
  private notifyChange(): void {
    if (this.onProjectChanged) {
      this.onProjectChanged(this.projectData);
    }
  }
}
