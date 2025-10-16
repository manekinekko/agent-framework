// Copyright (c) Microsoft. All rights reserved.

import type { AIAgent } from './agent.js';
import type { 
  ChatMessage, 
  AgentRunResponse, 
  AgentRunResponseUpdate,
  AgentRunOptions 
} from './types.js';
import type { AgentThread } from './thread.js';
import { DelegatingAIAgent } from './agent.js';

/**
 * Context for agent middleware.
 */
export interface AgentMiddlewareContext {
  /** The agent being invoked */
  agent: AIAgent;
  /** The input messages */
  messages: ChatMessage[];
  /** The thread being used, if any */
  thread?: AgentThread;
  /** Run options */
  options?: AgentRunOptions;
}

/**
 * Middleware function for processing agent requests.
 */
export type AgentMiddleware = (
  context: AgentMiddlewareContext,
  next: () => Promise<AgentRunResponse>
) => Promise<AgentRunResponse>;

/**
 * Middleware function for processing streaming agent requests.
 */
export type AgentStreamingMiddleware = (
  context: AgentMiddlewareContext,
  next: () => AsyncIterable<AgentRunResponseUpdate>
) => AsyncIterable<AgentRunResponseUpdate>;

/**
 * An agent that applies middleware to another agent.
 */
export class MiddlewareAgent extends DelegatingAIAgent {
  private readonly middleware: AgentMiddleware[];
  private readonly streamingMiddleware: AgentStreamingMiddleware[];

  constructor(
    innerAgent: AIAgent,
    options?: {
      middleware?: AgentMiddleware[];
      streamingMiddleware?: AgentStreamingMiddleware[];
    }
  ) {
    super(innerAgent);
    this.middleware = options?.middleware ?? [];
    this.streamingMiddleware = options?.streamingMiddleware ?? [];
  }

  async run(
    input: string | ChatMessage | ChatMessage[],
    options?: AgentRunOptions & { thread?: AgentThread }
  ): Promise<AgentRunResponse> {
    const messages = this.normalizeInput(input);
    const context: AgentMiddlewareContext = {
      agent: this,
      messages,
      thread: options?.thread,
      options,
    };

    // Build middleware chain
    let index = 0;
    const execute = async (): Promise<AgentRunResponse> => {
      if (index >= this.middleware.length) {
        // Base case: call the inner agent
        return this.innerAgent.run(messages, options);
      }

      const middleware = this.middleware[index++];
      return middleware(context, execute);
    };

    return execute();
  }

  async *runStream(
    input: string | ChatMessage | ChatMessage[],
    options?: AgentRunOptions & { thread?: AgentThread }
  ): AsyncIterable<AgentRunResponseUpdate> {
    const messages = this.normalizeInput(input);
    const context: AgentMiddlewareContext = {
      agent: this,
      messages,
      thread: options?.thread,
      options,
    };

    // Build middleware chain for streaming
    let index = 0;
    const self = this;
    async function* execute(): AsyncIterable<AgentRunResponseUpdate> {
      if (index >= self.streamingMiddleware.length) {
        // Base case: call the inner agent
        yield* self.innerAgent.runStream(messages, options);
        return;
      }

      const middleware = self.streamingMiddleware[index++];
      yield* middleware(context, execute);
    }

    yield* execute();
  }

  /**
   * Adds middleware to this agent.
   * @param middleware - The middleware to add
   * @returns This agent for chaining
   */
  use(middleware: AgentMiddleware): this {
    this.middleware.push(middleware);
    return this;
  }

  /**
   * Adds streaming middleware to this agent.
   * @param middleware - The streaming middleware to add
   * @returns This agent for chaining
   */
  useStreaming(middleware: AgentStreamingMiddleware): this {
    this.streamingMiddleware.push(middleware);
    return this;
  }
}

/**
 * Creates a logging middleware that logs agent requests and responses.
 * @param logger - Optional logger function (defaults to console.log)
 * @returns A middleware function
 */
export function createLoggingMiddleware(
  logger: (message: string) => void = console.log
): AgentMiddleware {
  return async (context, next) => {
    logger(`[Agent ${context.agent.displayName}] Starting request with ${context.messages.length} messages`);
    const startTime = Date.now();
    
    try {
      const response = await next();
      const duration = Date.now() - startTime;
      logger(`[Agent ${context.agent.displayName}] Completed in ${duration}ms`);
      return response;
    } catch (error) {
      const duration = Date.now() - startTime;
      logger(`[Agent ${context.agent.displayName}] Failed after ${duration}ms: ${error}`);
      throw error;
    }
  };
}

/**
 * Creates a retry middleware that retries failed requests.
 * @param maxRetries - Maximum number of retries
 * @param delay - Delay between retries in milliseconds
 * @returns A middleware function
 */
export function createRetryMiddleware(
  maxRetries = 3,
  delay = 1000
): AgentMiddleware {
  return async (_context, next) => {
    let lastError: unknown;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await next();
      } catch (error) {
        lastError = error;
        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, delay * (attempt + 1)));
        }
      }
    }
    
    throw lastError;
  };
}
