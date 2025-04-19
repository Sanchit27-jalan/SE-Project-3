import { Agent, Tool } from './types';
import { AgentBuilder } from './AgentBuilder';
import { ToolBuilder } from './ToolBuilder';

/**
 * Factory for creating canvas objects (agents and tools)
 * This follows the Factory Pattern to centralize object creation logic
 */
export class CanvasObjectFactory {
  /**
   * Creates a new agent instance for the canvas based on a template
   * Uses the Builder pattern internally for flexible object creation
   */
  static createAgentForCanvas(templateAgent: Agent): Agent {
    return AgentBuilder.create(templateAgent.type)
      .withName(templateAgent.name)
      .withDescription(templateAgent.description)
      .withSubtype(templateAgent.subtype)
      .withModel({ ...templateAgent.model })
      .withCapabilities([...templateAgent.capabilities])
      .withMemory({ ...templateAgent.memory })
      .withLearning({ ...templateAgent.learning })
      .withPosition({
        x: 200 + Math.random() * 100,
        y: 200 + Math.random() * 100,
      })
      .build();
  }

  /**
   * Creates a new agent from AI generation result
   */
  static createAgentFromGeneration(generatedData: any): Agent {
    const builder = AgentBuilder.create(generatedData.type || 'AI');

    return builder
      .withName(generatedData.name || '')
      .withDescription(generatedData.description || '')
      .withSubtype(generatedData.subtype || '')
      .withModel(
        generatedData.type === 'AI' ? { llmType: generatedData.model?.llmType || 'gpt-4' } : {}
      )
      .withCapabilities(generatedData.capabilities || [])
      .withMemory({ type: 'short-term' })
      .withLearning({ type: 'none' })
      .build();
  }

  /**
   * Creates a tool for a specific agent on the canvas
   */
  static createToolForAgent(templateTool: Tool, agentId: string): Tool {
    return ToolBuilder.create(templateTool.description, templateTool.type)
      .withName(templateTool.name)
      .withAgentId(agentId)
      .withSubtype(templateTool.subtype)
      .withAccessibleBy([...templateTool.accessibleBy])
      .withAuthentication({ ...templateTool.authentication })
      .withParameters({ ...templateTool.parameters })
      .withPosition({
        x: templateTool.position?.x || 0,
        y: templateTool.position?.y || 0,
      })
      .build();
  }

  /**
   * Creates a new tool from AI generation result
   */
  static createToolFromGeneration(generatedData: any): Tool {
    const builder = ToolBuilder.create(
      generatedData.description || '',
      generatedData.type || 'Information'
    );

    return builder
      .withName(generatedData.name || '')
      .withSubtype(generatedData.subtype || '')
      .withParameters(generatedData.parameters || {})
      .build();
  }

  /**
   * Creates a new default agent of the specified type
   * Useful for quick creation of new agents
   */
  static createDefaultAgent(type: string = 'AI'): Agent {
    const builder = AgentBuilder.create(type);

    switch (type) {
      case 'AI':
        return builder
          .withName('New AI Agent')
          .withDescription('AI-powered agent')
          .withSubtype('assistant')
          .withModel({ llmType: 'gpt-4' })
          .withCapabilities(['conversation'])
          .build();

      case 'Deterministic':
        return builder
          .withName('New Rule Agent')
          .withDescription('Rule-based deterministic agent')
          .withSubtype('rule-based')
          .build();

      case 'Hybrid':
        return builder
          .withName('New Hybrid Agent')
          .withDescription('Agent with both AI and rule-based capabilities')
          .withSubtype('hybrid')
          .withModel({ llmType: 'gpt-4' })
          .build();

      default:
        return builder.withName('New Agent').withDescription('Generic agent').build();
    }
  }

  /**
   * Creates a new default tool of the specified type
   */
  static createDefaultTool(type: string = 'Information'): Tool {
    const builder = ToolBuilder.create(`Default ${type} tool`, type);

    switch (type) {
      case 'Information':
        return builder.withName('Information Tool').withSubtype('data-retrieval').build();

      case 'Computational':
        return builder.withName('Computational Tool').withSubtype('processor').build();

      case 'Interaction':
        return builder.withName('Interaction Tool').withSubtype('interface').build();

      case 'Development':
        return builder.withName('Development Tool').withSubtype('code').build();

      default:
        return builder.withName('Generic Tool').build();
    }
  }

  /**
   * Creates a user input system agent (specialized factory method)
   * This is a special type of agent that represents user input in the system
   */
  static createUserInputAgent(): Agent {
    return AgentBuilder.create('Deterministic')
      .withId('user-input')
      .withName('User Input')
      .withDescription('Represents user input to the system')
      .withSubtype('system')
      .withPosition({ x: 100, y: 300 })
      .build();
  }

  /**
   * Creates a user output system agent (specialized factory method)
   * This is a special type of agent that represents system output to the user
   */
  static createUserOutputAgent(): Agent {
    return AgentBuilder.create('Deterministic')
      .withId('user-output')
      .withName('User Output')
      .withDescription('Represents system output to the user')
      .withSubtype('system')
      .withPosition({ x: 600, y: 300 })
      .build();
  }

  /**
   * Creates a tool with agent assignment in a single step
   */
  static createToolWithAgent(templateTool: Tool, agentId: string): Tool {
    return ToolBuilder.from(templateTool).withAgentId(agentId).build();
  }

  /**
   * Creates an agent from scratch with the most common configuration options
   */
  static createAgent(builder: AgentBuilder): Agent {
    return builder.build();
  }

  /**
   * Creates a tool from scratch with the most common configuration options
   */
  static createTool(builder: ToolBuilder): Tool {
    return builder.build();
  }
}
