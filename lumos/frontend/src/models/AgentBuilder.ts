import { Agent, Position } from "./types";

/**
 * Builder pattern implementation for creating Agent objects
 * This provides a fluent API for constructing complex Agent objects
 */
export class AgentBuilder {
  private id: string;
  private type: string;
  private name: string = "";
  private description: string = "";
  private subtype: string = "";
  private model: Record<string, any> = {};
  private capabilities: string[] = [];
  private memory: Record<string, any> = { type: "short-term" };
  private learning: Record<string, any> = { type: "none" };
  private position: Position = { x: 0, y: 0 };

  /**
   * Initialize the builder with required fields
   */
  constructor(id: string, type: string) {
    this.id = id;
    this.type = type;
  }

  /**
   * Creates a new builder instance with a timestamp-based ID
   */
  static create(type: string = "AI"): AgentBuilder {
    return new AgentBuilder(`agent-${Date.now()}`, type);
  }

  /**
   * Creates a new builder from an existing agent for editing
   */
  static from(agent: Agent): AgentBuilder {
    const builder = new AgentBuilder(agent.id, agent.type);
    return builder
      .withName(agent.name)
      .withDescription(agent.description)
      .withSubtype(agent.subtype)
      .withModel(agent.model)
      .withCapabilities(agent.capabilities)
      .withMemory(agent.memory)
      .withLearning(agent.learning)
      .withPosition(agent.position);
  }

  withName(name: string): AgentBuilder {
    this.name = name;
    return this;
  }

  withDescription(description: string): AgentBuilder {
    this.description = description;
    return this;
  }

  withSubtype(subtype: string): AgentBuilder {
    this.subtype = subtype;
    return this;
  }

  withModel(model: Record<string, any>): AgentBuilder {
    this.model = { ...model };
    return this;
  }

  withCapabilities(capabilities: string[]): AgentBuilder {
    this.capabilities = [...capabilities];
    return this;
  }

  addCapability(capability: string): AgentBuilder {
    if (capability.trim() && !this.capabilities.includes(capability.trim())) {
      this.capabilities.push(capability.trim());
    }
    return this;
  }

  removeCapability(capabilityOrIndex: string | number): AgentBuilder {
    if (typeof capabilityOrIndex === "number") {
      if (
        capabilityOrIndex >= 0 &&
        capabilityOrIndex < this.capabilities.length
      ) {
        this.capabilities.splice(capabilityOrIndex, 1);
      }
    } else {
      this.capabilities = this.capabilities.filter(
        (cap) => cap !== capabilityOrIndex,
      );
    }
    return this;
  }

  withMemory(memory: Record<string, any>): AgentBuilder {
    this.memory = { ...memory };
    return this;
  }

  withLearning(learning: Record<string, any>): AgentBuilder {
    this.learning = { ...learning };
    return this;
  }

  withPosition(position: Position): AgentBuilder {
    this.position = { ...position };
    return this;
  }

  withLLMType(llmType: string): AgentBuilder {
    this.model = { ...this.model, llmType };
    return this;
  }

  /**
   * Override the ID of the agent being built
   */
  withId(id: string): AgentBuilder {
    this.id = id;
    return this;
  }

  /**
   * Build the final Agent instance
   */
  build(): Agent {
    return new Agent(
      this.id,
      this.type,
      this.name,
      this.description,
      this.subtype,
      this.model,
      this.capabilities,
      this.memory,
      this.learning,
      this.position,
    );
  }
}
