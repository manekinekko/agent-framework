// Copyright (c) Microsoft. All rights reserved.

import { Role } from './types.js';
import type { 
  ChatMessage, 
  AgentRunResponse, 
  AgentRunResponseUpdate, 
  AgentRunOptions 
} from './types.js';
import type { AgentThread } from './thread.js';
import { InMemoryAgentThread } from './thread.js';

/**
 * Metadata about an AI agent.
 */
export interface AIAgentMetadata {
  /** The agent's unique identifier */
  id: string;
  /** The agent's name */
  name?: string;
  /** The agent's description */
  description?: string;
  /** Additional properties */
  [key: string]: unknown;
}

/**
 * Base abstraction for all AI agents.
 * 
 * Provides the core interface for agent interactions and conversation management.
 * An agent instance may participate in multiple concurrent conversations, and each
 * conversation may involve multiple agents working together.
 */
export abstract class AIAgent {
  private readonly _id: string;
  private readonly _name?: string;
  private readonly _description?: string;

  constructor(options?: {
    id?: string;
    name?: string;
    description?: string;
  }) {
    this._id = options?.id ?? this.generateId();
    this._name = options?.name;
    this._description = options?.description;
  }

  /**
   * Gets the unique identifier for this agent instance.
   */
  get id(): string {
    return this._id;
  }

  /**
   * Gets the human-readable name of the agent.
   */
  get name(): string | undefined {
    return this._name;
  }

  /**
   * Gets a display-friendly name for the agent.
   * Returns the name if available, otherwise the ID.
   */
  get displayName(): string {
    return this._name ?? this._id;
  }

  /**
   * Gets a description of the agent's purpose, capabilities, or behavior.
   */
  get description(): string | undefined {
    return this._description;
  }

  /**
   * Gets metadata about the agent.
   */
  getMetadata(): AIAgentMetadata {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
    };
  }

  /**
   * Runs the agent with the given input.
   * @param input - The input message(s) or a single message string
   * @param options - Optional configuration for the run
   * @returns The agent's response
   */
  abstract run(
    input: string | ChatMessage | ChatMessage[],
    options?: AgentRunOptions & { thread?: AgentThread }
  ): Promise<AgentRunResponse>;

  /**
   * Runs the agent with streaming responses.
   * @param input - The input message(s) or a single message string
   * @param options - Optional configuration for the run
   * @returns An async iterable of response updates
   */
  abstract runStream(
    input: string | ChatMessage | ChatMessage[],
    options?: AgentRunOptions & { thread?: AgentThread }
  ): AsyncIterable<AgentRunResponseUpdate>;

  /**
   * Creates a new thread for conversations with this agent.
   * @returns A new agent thread
   */
  createThread(): AgentThread {
    return new InMemoryAgentThread();
  }

  /**
   * Deserializes a thread from its serialized form.
   * @param data - The serialized thread data
   * @returns The deserialized thread
   */
  deserializeThread(data: Record<string, unknown>): AgentThread {
    // Default implementation creates an in-memory thread
    // Subclasses can override to support custom thread types
    const metadata = data.metadata as Record<string, unknown> | undefined;
    return new InMemoryAgentThread(undefined, metadata);
  }

  /**
   * Generates a unique identifier for the agent.
   * @returns A unique ID string
   */
  protected generateId(): string {
    return `agent-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
  }

  /**
   * Normalizes input to an array of ChatMessages.
   * @param input - The input to normalize
   * @returns An array of ChatMessages
   */
  protected normalizeInput(input: string | ChatMessage | ChatMessage[]): ChatMessage[] {
    if (typeof input === 'string') {
      return [{ role: Role.User, content: input }];
    }
    return Array.isArray(input) ? input : [input];
  }
}

/**
 * A delegating agent that wraps another agent.
 * Useful for adding middleware or modifying behavior without changing the underlying agent.
 */
export abstract class DelegatingAIAgent extends AIAgent {
  constructor(
    protected readonly innerAgent: AIAgent,
    options?: {
      id?: string;
      name?: string;
      description?: string;
    }
  ) {
    super({
      id: options?.id ?? innerAgent.id,
      name: options?.name ?? innerAgent.name,
      description: options?.description ?? innerAgent.description,
    });
  }

  override get id(): string {
    return this.innerAgent.id;
  }

  override get name(): string | undefined {
    return this.innerAgent.name;
  }

  override get description(): string | undefined {
    return this.innerAgent.description;
  }

  override getMetadata(): AIAgentMetadata {
    return this.innerAgent.getMetadata();
  }

  override createThread(): AgentThread {
    return this.innerAgent.createThread();
  }

  override deserializeThread(data: Record<string, unknown>): AgentThread {
    return this.innerAgent.deserializeThread(data);
  }
}
