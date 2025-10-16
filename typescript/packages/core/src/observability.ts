// Copyright (c) Microsoft. All rights reserved.

import { trace, SpanStatusCode, Span, Tracer } from '@opentelemetry/api';
import type { AIAgent } from './agent.js';
import type { AgentRunResponse, AgentRunResponseUpdate, ChatMessage } from './types.js';
import type { AgentThread } from './thread.js';
import { DelegatingAIAgent } from './agent.js';

/**
 * OpenTelemetry attribute constants for agent framework telemetry.
 */
export const OtelAttr = {
  // Agent attributes
  AGENT_ID: 'agent.id',
  AGENT_NAME: 'agent.name',
  AGENT_DESCRIPTION: 'agent.description',
  
  // Run attributes
  AGENT_RUN_SPAN: 'agent.run',
  AGENT_RUN_STREAM_SPAN: 'agent.run.stream',
  AGENT_RUN_ID: 'agent.run.id',
  
  // Message attributes
  AGENT_MESSAGE_COUNT: 'agent.message.count',
  AGENT_MESSAGE_ROLE: 'agent.message.role',
  AGENT_MESSAGE_CONTENT_LENGTH: 'agent.message.content.length',
  
  // Thread attributes
  AGENT_THREAD_ID: 'agent.thread.id',
  
  // Tool attributes
  AGENT_TOOL_CALL_COUNT: 'agent.tool.call.count',
  AGENT_TOOL_NAME: 'agent.tool.name',
  
  // Token usage
  AGENT_TOKEN_PROMPT: 'agent.token.prompt',
  AGENT_TOKEN_COMPLETION: 'agent.token.completion',
  AGENT_TOKEN_TOTAL: 'agent.token.total',
  
  // Events
  AGENT_RUN_STARTED: 'agent.run.started',
  AGENT_RUN_COMPLETED: 'agent.run.completed',
  AGENT_RUN_FAILED: 'agent.run.failed',
  AGENT_TOOL_CALLED: 'agent.tool.called',
  AGENT_STREAMING_STARTED: 'agent.streaming.started',
  AGENT_STREAMING_CHUNK: 'agent.streaming.chunk',
  AGENT_STREAMING_COMPLETED: 'agent.streaming.completed',
} as const;

/**
 * Configuration for OpenTelemetry observability.
 */
export interface ObservabilityConfig {
  /** Whether to enable observability */
  enabled?: boolean;
  /** Custom tracer name */
  tracerName?: string;
  /** Whether to capture message content (may contain sensitive data) */
  captureMessageContent?: boolean;
}

const DEFAULT_TRACER_NAME = '@microsoft/agent-framework';
let globalConfig: ObservabilityConfig = {
  enabled: true,
  tracerName: DEFAULT_TRACER_NAME,
  captureMessageContent: false,
};

/**
 * Get the global tracer for agent framework.
 */
export function getTracer(): Tracer {
  return trace.getTracer(globalConfig.tracerName || DEFAULT_TRACER_NAME);
}

/**
 * Configure global observability settings.
 * @param config - The observability configuration
 */
export function setupObservability(config: ObservabilityConfig): void {
  globalConfig = { ...globalConfig, ...config };
}

/**
 * Get the current observability configuration.
 */
export function getObservabilityConfig(): Readonly<ObservabilityConfig> {
  return { ...globalConfig };
}

/**
 * Create attributes for an agent span.
 */
function createAgentAttributes(agent: AIAgent): Record<string, string | number | boolean> {
  const attributes: Record<string, string | number | boolean> = {
    [OtelAttr.AGENT_ID]: agent.id,
  };
  
  if (agent.name) {
    attributes[OtelAttr.AGENT_NAME] = agent.name;
  }
  
  if (agent.description) {
    attributes[OtelAttr.AGENT_DESCRIPTION] = agent.description;
  }
  
  return attributes;
}

/**
 * Create attributes for messages.
 */
function createMessageAttributes(messages: ChatMessage[]): Record<string, string | number> {
  const attributes: Record<string, string | number> = {
    [OtelAttr.AGENT_MESSAGE_COUNT]: messages.length,
  };
  
  if (globalConfig.captureMessageContent) {
    const totalLength = messages.reduce((sum, msg) => sum + msg.content.length, 0);
    attributes[OtelAttr.AGENT_MESSAGE_CONTENT_LENGTH] = totalLength;
  }
  
  return attributes;
}

/**
 * Record token usage on a span.
 */
function recordTokenUsage(span: Span, response: AgentRunResponse): void {
  if (response.usage) {
    span.setAttributes({
      [OtelAttr.AGENT_TOKEN_PROMPT]: response.usage.promptTokens,
      [OtelAttr.AGENT_TOKEN_COMPLETION]: response.usage.completionTokens,
      [OtelAttr.AGENT_TOKEN_TOTAL]: response.usage.totalTokens,
    });
  }
}

/**
 * An AI agent wrapper that adds OpenTelemetry instrumentation.
 */
export class ObservableAIAgent extends DelegatingAIAgent {
  constructor(innerAgent: AIAgent) {
    super(innerAgent);
  }

  override async run(
    input: string | ChatMessage | ChatMessage[],
    options?: { thread?: AgentThread }
  ): Promise<AgentRunResponse> {
    if (!globalConfig.enabled) {
      return this.innerAgent.run(input, options);
    }

    const tracer = getTracer();
    const messages = this.normalizeInput(input);
    
    return tracer.startActiveSpan(
      OtelAttr.AGENT_RUN_SPAN,
      {
        attributes: {
          ...createAgentAttributes(this),
          ...createMessageAttributes(messages),
          ...(options?.thread ? { [OtelAttr.AGENT_THREAD_ID]: 'thread-attached' } : {}),
        },
      },
      async (span) => {
        try {
          span.addEvent(OtelAttr.AGENT_RUN_STARTED);
          
          const response = await this.innerAgent.run(input, options);
          
          // Record metrics
          recordTokenUsage(span, response);
          
          if (response.messages.length > 0) {
            span.setAttribute(OtelAttr.AGENT_MESSAGE_COUNT, response.messages.length);
          }
          
          span.addEvent(OtelAttr.AGENT_RUN_COMPLETED);
          span.setStatus({ code: SpanStatusCode.OK });
          
          return response;
        } catch (error) {
          span.addEvent(OtelAttr.AGENT_RUN_FAILED, {
            'error.message': error instanceof Error ? error.message : String(error),
          });
          span.setStatus({
            code: SpanStatusCode.ERROR,
            message: error instanceof Error ? error.message : String(error),
          });
          span.recordException(error as Error);
          throw error;
        } finally {
          span.end();
        }
      }
    );
  }

  override async *runStream(
    input: string | ChatMessage | ChatMessage[],
    options?: { thread?: AgentThread }
  ): AsyncIterable<AgentRunResponseUpdate> {
    if (!globalConfig.enabled) {
      yield* this.innerAgent.runStream(input, options);
      return;
    }

    const tracer = getTracer();
    const messages = this.normalizeInput(input);
    
    const span = tracer.startSpan(OtelAttr.AGENT_RUN_STREAM_SPAN, {
      attributes: {
        ...createAgentAttributes(this),
        ...createMessageAttributes(messages),
        ...(options?.thread ? { [OtelAttr.AGENT_THREAD_ID]: 'thread-attached' } : {}),
      },
    });

    try {
      span.addEvent(OtelAttr.AGENT_STREAMING_STARTED);
      
      let chunkCount = 0;
      for await (const update of this.innerAgent.runStream(input, options)) {
        if (update.text) {
          chunkCount++;
          span.addEvent(OtelAttr.AGENT_STREAMING_CHUNK, {
            'chunk.number': chunkCount,
            'chunk.length': update.text.length,
          });
        }
        
        yield update;
      }
      
      span.addEvent(OtelAttr.AGENT_STREAMING_COMPLETED, {
        'total.chunks': chunkCount,
      });
      span.setStatus({ code: SpanStatusCode.OK });
    } catch (error) {
      span.addEvent(OtelAttr.AGENT_RUN_FAILED, {
        'error.message': error instanceof Error ? error.message : String(error),
      });
      span.setStatus({
        code: SpanStatusCode.ERROR,
        message: error instanceof Error ? error.message : String(error),
      });
      span.recordException(error as Error);
      throw error;
    } finally {
      span.end();
    }
  }
}

/**
 * Wrap an agent with OpenTelemetry instrumentation.
 * @param agent - The agent to instrument
 * @returns An instrumented agent
 */
export function withObservability(agent: AIAgent): AIAgent {
  if (agent instanceof ObservableAIAgent) {
    return agent; // Already instrumented
  }
  return new ObservableAIAgent(agent);
}

/**
 * Decorator function to add observability to an agent.
 * Use this to automatically instrument agents.
 * 
 * @example
 * ```typescript
 * const agent = useObservability(
 *   client.createAgent({ name: 'MyAgent' })
 * );
 * ```
 */
export function useObservability<T extends AIAgent>(agent: T): T {
  return withObservability(agent) as T;
}
