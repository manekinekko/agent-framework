// Copyright (c) Microsoft. All rights reserved.

/**
 * Microsoft Agent Framework for TypeScript/JavaScript
 * 
 * A comprehensive framework for building, orchestrating, and deploying AI agents.
 * 
 * @packageDocumentation
 */

// Core abstractions
export { AIAgent, DelegatingAIAgent } from './agent.js';
export type { AIAgentMetadata } from './agent.js';

// Thread management
export { AgentThread, InMemoryAgentThread } from './thread.js';
export type { AgentThreadMetadata } from './thread.js';

// Message storage
export { InMemoryChatMessageStore } from './message-store.js';
export type { ChatMessageStore } from './message-store.js';

// Types
export {
  Role,
  type ChatMessage,
  type ToolCall,
  type ToolMode,
  type ChatOptions,
  type ChatResponse,
  type ChatResponseUpdate,
  type ToolCallDelta,
  type AgentRunResponse,
  type AgentRunResponseUpdate,
  type AgentRunOptions,
  type Context,
  type ContextProvider,
} from './types.js';

// Tools
export {
  createFunction,
  inferSchema,
  defineFunction,
  type AIFunction,
  type FunctionDefinition,
  type JSONSchema,
} from './tools.js';

// Middleware
export {
  MiddlewareAgent,
  createLoggingMiddleware,
  createRetryMiddleware,
  type AgentMiddleware,
  type AgentStreamingMiddleware,
  type AgentMiddlewareContext,
} from './middleware.js';

// OpenAI client
export {
  OpenAIChatClient,
  OpenAIChatAgent,
  type OpenAIChatAgentOptions,
} from './openai-client.js';

// Azure OpenAI client
export {
  AzureOpenAIChatClient,
} from './azure-openai-client.js';

// Observability (OpenTelemetry)
export {
  ObservableAIAgent,
  withObservability,
  useObservability,
  setupObservability,
  getObservabilityConfig,
  getTracer,
  OtelAttr,
  type ObservabilityConfig,
} from './observability.js';

// Workflows
export {
  Workflow,
  WorkflowBuilder,
  createHandOffWorkflow,
  WorkflowRunState,
  type WorkflowEvent,
  type WorkflowStartedEvent,
  type WorkflowCompletedEvent,
  type WorkflowFailedEvent,
  type ExecutorInvokedEvent,
  type ExecutorCompletedEvent,
  type ExecutorFailedEvent,
  type WorkflowOutputEvent,
  type AgentRunEvent,
  type WorkflowEventType,
  type WorkflowContext,
  type ExecutorFunction,
  type AgentExecutorConfig,
  type ExecutorConfig,
  type EdgeCondition,
  type EdgeConfig,
  type WorkflowConfig,
  type WorkflowRunResult,
} from './workflow/index.js';
