// Copyright (c) Microsoft. All rights reserved.

import type { AIAgent } from '../agent.js';
import type { ChatMessage, AgentRunResponse } from '../types.js';

/**
 * Workflow run state.
 */
export enum WorkflowRunState {
  /** Workflow is currently executing */
  InProgress = 'IN_PROGRESS',
  /** Workflow is idle (completed successfully) */
  Idle = 'IDLE',
  /** Workflow failed with an error */
  Failed = 'FAILED',
}

/**
 * Base interface for workflow events.
 */
export interface WorkflowEvent {
  /** Event type */
  type: string;
  /** Timestamp when the event occurred */
  timestamp: number;
}

/**
 * Event emitted when workflow starts.
 */
export interface WorkflowStartedEvent extends WorkflowEvent {
  type: 'workflow.started';
}

/**
 * Event emitted when workflow completes successfully.
 */
export interface WorkflowCompletedEvent extends WorkflowEvent {
  type: 'workflow.completed';
}

/**
 * Event emitted when workflow fails.
 */
export interface WorkflowFailedEvent extends WorkflowEvent {
  type: 'workflow.failed';
  error: Error;
}

/**
 * Event emitted when an executor starts.
 */
export interface ExecutorInvokedEvent extends WorkflowEvent {
  type: 'executor.invoked';
  executorId: string;
}

/**
 * Event emitted when an executor completes.
 */
export interface ExecutorCompletedEvent extends WorkflowEvent {
  type: 'executor.completed';
  executorId: string;
  result: unknown;
}

/**
 * Event emitted when an executor fails.
 */
export interface ExecutorFailedEvent extends WorkflowEvent {
  type: 'executor.failed';
  executorId: string;
  error: Error;
}

/**
 * Event emitted when workflow produces output.
 */
export interface WorkflowOutputEvent extends WorkflowEvent {
  type: 'workflow.output';
  data: unknown;
}

/**
 * Event emitted for agent run within workflow.
 */
export interface AgentRunEvent extends WorkflowEvent {
  type: 'agent.run';
  executorId: string;
  agentId: string;
  data: AgentRunResponse;
}

/**
 * Union type of all workflow events.
 */
export type WorkflowEventType =
  | WorkflowStartedEvent
  | WorkflowCompletedEvent
  | WorkflowFailedEvent
  | ExecutorInvokedEvent
  | ExecutorCompletedEvent
  | ExecutorFailedEvent
  | WorkflowOutputEvent
  | AgentRunEvent;

/**
 * Context provided to executors during workflow execution.
 */
export interface WorkflowContext {
  /** Output a value from the workflow */
  output(value: unknown): void;
  
  /** Get shared state by key */
  getState<T = unknown>(key: string): T | undefined;
  
  /** Set shared state by key */
  setState<T = unknown>(key: string, value: T): void;
  
  /** Check if state exists */
  hasState(key: string): boolean;
  
  /** Clear state by key */
  clearState(key: string): void;
}

/**
 * Function that executes workflow logic.
 */
export type ExecutorFunction = (
  input: unknown,
  context: WorkflowContext
) => Promise<unknown>;

/**
 * Agent executor that wraps an AI agent.
 */
export interface AgentExecutorConfig {
  agent: AIAgent;
  /** Optional prompt template or function to generate prompt from input */
  promptTemplate?: string | ((input: unknown) => string | ChatMessage | ChatMessage[]);
}

/**
 * Configuration for an executor.
 */
export type ExecutorConfig = ExecutorFunction | AgentExecutorConfig;

/**
 * Edge condition function.
 */
export type EdgeCondition = (result: unknown) => boolean | Promise<boolean>;

/**
 * Edge configuration.
 */
export interface EdgeConfig {
  /** Source executor ID */
  from: string;
  /** Target executor ID */
  to: string;
  /** Optional condition to determine if edge should be followed */
  condition?: EdgeCondition;
}

/**
 * Workflow configuration.
 */
export interface WorkflowConfig {
  /** Workflow ID */
  id?: string;
  /** Workflow name */
  name?: string;
  /** Workflow description */
  description?: string;
  /** Starting executor ID */
  startExecutor: string;
  /** Map of executor ID to executor configuration */
  executors: Record<string, ExecutorConfig>;
  /** Array of edges connecting executors */
  edges: EdgeConfig[];
  /** Maximum iterations to prevent infinite loops */
  maxIterations?: number;
}

/**
 * Result of a workflow run.
 */
export interface WorkflowRunResult {
  /** Final state of the workflow */
  state: WorkflowRunState;
  /** All events generated during execution */
  events: WorkflowEventType[];
  /** Output values from the workflow */
  outputs: unknown[];
  /** Error if workflow failed */
  error?: Error;
}
