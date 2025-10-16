// Copyright (c) Microsoft. All rights reserved.

/**
 * Represents the role of a message sender in a conversation.
 */
export enum Role {
  /** System-level instructions or configuration */
  System = 'system',
  /** Messages from the user */
  User = 'user',
  /** Messages from the AI assistant */
  Assistant = 'assistant',
  /** Messages related to tool/function calls and results */
  Tool = 'tool',
}

/**
 * Represents a single message in a conversation.
 */
export interface ChatMessage {
  /** The role of the message sender */
  role: Role;
  /** The text content of the message */
  content: string;
  /** Optional name identifying the sender */
  name?: string;
  /** Optional tool/function call information */
  toolCalls?: ToolCall[];
  /** Optional tool/function call ID this message responds to */
  toolCallId?: string;
}

/**
 * Represents a tool/function call in a message.
 */
export interface ToolCall {
  /** Unique identifier for the tool call */
  id: string;
  /** Type of the tool call (always 'function' for now) */
  type: 'function';
  /** Function call details */
  function: {
    /** Name of the function to call */
    name: string;
    /** JSON string of function arguments */
    arguments: string;
  };
}

/**
 * Options for controlling how tools are used during agent execution.
 */
export type ToolMode = 'auto' | 'required' | 'none';

/**
 * Options for configuring a chat completion request.
 */
export interface ChatOptions {
  /** The model to use for the chat completion */
  model?: string;
  /** Controls randomness in the response (0-2) */
  temperature?: number;
  /** Maximum number of tokens to generate */
  maxTokens?: number;
  /** Controls diversity via nucleus sampling (0-1) */
  topP?: number;
  /** Sequences where the API will stop generating tokens */
  stopSequences?: string[];
  /** Number between -2.0 and 2.0 for frequency penalty */
  frequencyPenalty?: number;
  /** Number between -2.0 and 2.0 for presence penalty */
  presencePenalty?: number;
  /** Tool/function calling mode */
  toolMode?: ToolMode;
  /** Additional options for specific providers */
  additionalProperties?: Record<string, unknown>;
}

/**
 * Response from a chat completion request.
 */
export interface ChatResponse {
  /** The generated message */
  message: ChatMessage;
  /** Usage statistics for the request */
  usage?: {
    /** Number of tokens in the prompt */
    promptTokens: number;
    /** Number of tokens in the completion */
    completionTokens: number;
    /** Total number of tokens used */
    totalTokens: number;
  };
  /** The model used for the completion */
  model?: string;
  /** The finish reason for the completion */
  finishReason?: 'stop' | 'length' | 'tool_calls' | 'content_filter';
}

/**
 * Streaming update from a chat completion request.
 */
export interface ChatResponseUpdate {
  /** Delta content to append to the response */
  delta?: string;
  /** Tool call deltas */
  toolCallDeltas?: ToolCallDelta[];
  /** The finish reason if the stream is complete */
  finishReason?: 'stop' | 'length' | 'tool_calls' | 'content_filter';
}

/**
 * Represents a delta/update to a tool call during streaming.
 */
export interface ToolCallDelta {
  /** Index of the tool call */
  index: number;
  /** Tool call ID */
  id?: string;
  /** Type of the tool call */
  type?: 'function';
  /** Function call delta */
  function?: {
    /** Function name delta */
    name?: string;
    /** Function arguments delta */
    arguments?: string;
  };
}

/**
 * Response from an agent run.
 */
export interface AgentRunResponse {
  /** The messages generated during the run */
  messages: ChatMessage[];
  /** Unique identifier for this response */
  responseId: string;
  /** The final text response */
  text?: string;
  /** Usage statistics */
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

/**
 * Streaming update from an agent run.
 */
export interface AgentRunResponseUpdate {
  /** Text delta to append */
  text?: string;
  /** Complete messages if any were finalized */
  messages?: ChatMessage[];
  /** Whether this is the final update */
  isComplete?: boolean;
}

/**
 * Options for running an agent.
 */
export interface AgentRunOptions {
  /** Additional options for specific agent types */
  additionalProperties?: Record<string, unknown>;
}

/**
 * Context information that can be provided to an agent.
 */
export interface Context {
  /** The context data */
  data: Record<string, unknown>;
  /** Optional priority for context ordering */
  priority?: number;
}

/**
 * Provider interface for supplying context to agents.
 */
export interface ContextProvider {
  /**
   * Gets the context data.
   * @param messages - Current conversation messages
   * @returns The context to provide to the agent
   */
  getContext(messages: ChatMessage[]): Promise<Context>;
}
