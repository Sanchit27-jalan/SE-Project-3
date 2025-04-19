import { Tool, Position } from './types';

/**
 * Builder pattern implementation for creating Tool objects
 * This provides a fluent API for constructing complex Tool objects
 */
export class ToolBuilder {
  private id: string;
  private description: string;
  private type: string;
  private name: string = '';
  private agentId: string = '';
  private subtype: string = '';
  private accessibleBy: string[] = [];
  private authentication: Record<string, any> = {};
  private parameters: Record<string, any> = {};
  private position: Position = { x: 0, y: 0 };

  /**
   * Initialize the builder with required fields
   */
  constructor(id: string, description: string, type: string) {
    this.id = id;
    this.description = description;
    this.type = type;
  }

  /**
   * Creates a new builder instance with a timestamp-based ID
   */
  static create(description: string, type: string = 'Information'): ToolBuilder {
    return new ToolBuilder(`tool-${Date.now()}`, description, type);
  }

  /**
   * Creates a new builder from an existing tool for editing
   */
  static from(tool: Tool): ToolBuilder {
    const builder = new ToolBuilder(tool.id, tool.description, tool.type);
    return builder
      .withName(tool.name)
      .withAgentId(tool.agentId)
      .withSubtype(tool.subtype)
      .withAccessibleBy(tool.accessibleBy)
      .withAuthentication(tool.authentication)
      .withParameters(tool.parameters)
      .withPosition(tool.position);
  }

  withName(name: string): ToolBuilder {
    this.name = name;
    return this;
  }

  withAgentId(agentId: string): ToolBuilder {
    this.agentId = agentId;
    return this;
  }

  withSubtype(subtype: string): ToolBuilder {
    this.subtype = subtype;
    return this;
  }

  withAccessibleBy(accessibleBy: string[]): ToolBuilder {
    this.accessibleBy = [...accessibleBy];
    return this;
  }

  addAccessibleBy(agentId: string): ToolBuilder {
    if (agentId && !this.accessibleBy.includes(agentId)) {
      this.accessibleBy.push(agentId);
    }
    return this;
  }

  withAuthentication(authentication: Record<string, any>): ToolBuilder {
    this.authentication = { ...authentication };
    return this;
  }

  withParameters(parameters: Record<string, any>): ToolBuilder {
    this.parameters = { ...parameters };
    return this;
  }

  withPosition(position: Position): ToolBuilder {
    this.position = { ...position };
    return this;
  }

  /**
   * Override the ID of the tool being built
   */
  withId(id: string): ToolBuilder {
    this.id = id;
    return this;
  }

  /**
   * Build the final Tool instance
   */
  build(): Tool {
    return new Tool(
      this.id,
      this.description,
      this.type,
      this.name,
      this.agentId,
      this.subtype,
      this.accessibleBy,
      this.authentication,
      this.parameters,
      this.position
    );
  }
}
