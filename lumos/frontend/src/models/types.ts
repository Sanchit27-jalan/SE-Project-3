/**
 * Project data types for the agent orchestration system
 * Aligned with the Lumos Definition Language
 */

export interface Position {
  x: number;
  y: number;
}

export class Project {
  constructor(
    public id: string,
    public name: string,
    public version: string = '',
    public description: string = '',
    public authors: string[] = []
  ) {}
}

export class Agent {
  userPositioned: boolean;
  manuallyPositioned: boolean;
  constructor(
    public id: string,
    public type: string,
    public name: string = '',
    public description: string = '',
    public subtype: string = '',
    public model: Record<string, any> = {},
    public capabilities: string[] = [],
    public memory: Record<string, any> = { type: 'short-term' },
    public learning: Record<string, any> = { type: 'none' },
    public position: Position = { x: 0, y: 0 }
  ) {}
}

export class Tool {
  constructor(
    public id: string,
    public description: string,
    public type: string,
    public name: string = '',
    public agentId: string = '',
    public subtype: string = '',
    public accessibleBy: string[] = [],
    public authentication: Record<string, any> = {},
    public parameters: Record<string, any> = {},
    public position: Position = { x: 0, y: 0 }
  ) {}
}

export class Interaction {
  constructor(
    public id: string,
    public name: string = '',
    public description: string = '',
    public type: string = 'AgentAgent',
    public participants: string[] = [],
    public protocol: {
      type: string;
      messageTypes: string[];
    } = { type: 'DirectedMessaging', messageTypes: ['task'] }
  ) {}
}

export class ProjectData {
  constructor(
    public project: Project,
    public agents: Agent[] = [],
    public tools: Tool[] = [],
    public interactions: Interaction[] = []
  ) {}
}

export enum NodeType {
  AGENT = 'agent',
  USER_INPUT = 'user-input',
  USER_OUTPUT = 'user-output',
}

export interface NodeData {
  id: string;
  label: string;
  type: NodeType;
  data: Agent;
}
