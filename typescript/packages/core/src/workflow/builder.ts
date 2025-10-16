// Copyright (c) Microsoft. All rights reserved.

import type { AIAgent } from '../agent.js';
import type {
  WorkflowConfig,
  ExecutorConfig,
  EdgeConfig,
  EdgeCondition,
  AgentExecutorConfig,
  ExecutorFunction,
} from './types.js';
import { Workflow } from './workflow.js';

/**
 * Fluent builder for creating workflows.
 * 
 * @example
 * ```typescript
 * const workflow = new WorkflowBuilder()
 *   .setStartExecutor('writer')
 *   .addExecutor('writer', writerAgent)
 *   .addExecutor('reviewer', reviewerAgent)
 *   .addEdge('writer', 'reviewer')
 *   .build();
 * ```
 */
export class WorkflowBuilder {
  private id?: string;
  private name?: string;
  private description?: string;
  private startExecutor?: string;
  private executors: Record<string, ExecutorConfig> = {};
  private edges: EdgeConfig[] = [];
  private maxIterations?: number;

  /**
   * Set the workflow ID.
   */
  setId(id: string): this {
    this.id = id;
    return this;
  }

  /**
   * Set the workflow name.
   */
  setName(name: string): this {
    this.name = name;
    return this;
  }

  /**
   * Set the workflow description.
   */
  setDescription(description: string): this {
    this.description = description;
    return this;
  }

  /**
   * Set the starting executor.
   * Can be either an executor ID (if already added) or an agent/function (will be added automatically).
   */
  setStartExecutor(idOrExecutor: string | AIAgent | ExecutorFunction): this {
    if (typeof idOrExecutor === 'string') {
      this.startExecutor = idOrExecutor;
    } else if (typeof idOrExecutor === 'function') {
      const id = 'start';
      this.addExecutor(id, idOrExecutor);
      this.startExecutor = id;
    } else {
      // It's an agent
      const id = idOrExecutor.name || idOrExecutor.id;
      this.addExecutor(id, idOrExecutor);
      this.startExecutor = id;
    }
    return this;
  }

  /**
   * Add an executor to the workflow.
   * @param id - Unique identifier for the executor
   * @param executor - Agent, function, or agent executor config
   */
  addExecutor(
    id: string,
    executor: AIAgent | ExecutorFunction | AgentExecutorConfig
  ): this {
    if (this.executors[id]) {
      throw new Error(`Executor with ID "${id}" already exists`);
    }
    
    // Check if it's an AI agent
    if ('run' in executor && typeof executor.run === 'function') {
      this.executors[id] = { agent: executor as AIAgent };
    } else {
      this.executors[id] = executor as ExecutorConfig;
    }
    
    return this;
  }

  /**
   * Add an edge between two executors.
   * @param from - Source executor ID or agent
   * @param to - Target executor ID or agent
   * @param condition - Optional condition function
   */
  addEdge(
    from: string | AIAgent,
    to: string | AIAgent,
    condition?: EdgeCondition
  ): this {
    const fromId = typeof from === 'string' ? from : (from.name || from.id);
    const toId = typeof to === 'string' ? to : (to.name || to.id);
    
    this.edges.push({
      from: fromId,
      to: toId,
      condition,
    });
    
    return this;
  }

  /**
   * Add a conditional edge that branches based on a condition.
   * @param from - Source executor
   * @param condition - Condition function
   * @param trueBranch - Target if condition is true
   * @param falseBranch - Target if condition is false
   */
  addConditionalEdge(
    from: string | AIAgent,
    condition: EdgeCondition,
    trueBranch: string | AIAgent,
    falseBranch: string | AIAgent
  ): this {
    const fromId = typeof from === 'string' ? from : (from.name || from.id);
    const trueId = typeof trueBranch === 'string' ? trueBranch : (trueBranch.name || trueBranch.id);
    const falseId = typeof falseBranch === 'string' ? falseBranch : (falseBranch.name || falseBranch.id);
    
    this.edges.push({
      from: fromId,
      to: trueId,
      condition,
    });
    
    this.edges.push({
      from: fromId,
      to: falseId,
      condition: async (result) => !(await condition(result)),
    });
    
    return this;
  }

  /**
   * Set the maximum number of iterations.
   */
  setMaxIterations(max: number): this {
    this.maxIterations = max;
    return this;
  }

  /**
   * Build the workflow.
   * @returns A configured Workflow instance
   */
  build(): Workflow {
    if (!this.startExecutor) {
      throw new Error('Start executor must be set before building workflow');
    }
    
    if (Object.keys(this.executors).length === 0) {
      throw new Error('At least one executor must be added before building workflow');
    }
    
    const config: WorkflowConfig = {
      id: this.id,
      name: this.name,
      description: this.description,
      startExecutor: this.startExecutor,
      executors: this.executors,
      edges: this.edges,
      maxIterations: this.maxIterations,
    };
    
    return new Workflow(config);
  }
}

/**
 * Create a simple sequential workflow with agents.
 * This is a helper for the common HandOff pattern where one agent hands off to another.
 * 
 * @example
 * ```typescript
 * // Create a writer -> reviewer handoff workflow
 * const workflow = createHandOffWorkflow([writerAgent, reviewerAgent]);
 * const result = await workflow.run('Create a product description');
 * ```
 * 
 * @param agents - Array of agents to execute in sequence
 * @param options - Optional workflow configuration
 * @returns A configured Workflow instance
 */
export function createHandOffWorkflow(
  agents: AIAgent[],
  options?: {
    name?: string;
    description?: string;
    maxIterations?: number;
  }
): Workflow {
  if (agents.length === 0) {
    throw new Error('At least one agent must be provided');
  }
  
  const builder = new WorkflowBuilder();
  
  if (options?.name) {
    builder.setName(options.name);
  }
  
  if (options?.description) {
    builder.setDescription(options.description);
  }
  
  if (options?.maxIterations) {
    builder.setMaxIterations(options.maxIterations);
  }
  
  // Add all agents as executors
  for (const agent of agents) {
    const id = agent.name || agent.id;
    builder.addExecutor(id, agent);
  }
  
  // Set start executor to first agent
  builder.setStartExecutor(agents[0].name || agents[0].id);
  
  // Create sequential edges
  for (let i = 0; i < agents.length - 1; i++) {
    const fromId = agents[i].name || agents[i].id;
    const toId = agents[i + 1].name || agents[i + 1].id;
    builder.addEdge(fromId, toId);
  }
  
  return builder.build();
}
