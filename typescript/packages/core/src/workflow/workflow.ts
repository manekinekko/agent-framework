// Copyright (c) Microsoft. All rights reserved.

import type { ChatMessage } from '../types.js';
import type {
  WorkflowConfig,
  WorkflowContext,
  WorkflowEventType,
  WorkflowRunResult,
  ExecutorConfig,
  ExecutorFunction,
  AgentExecutorConfig,
} from './types.js';
import { WorkflowRunState } from './types.js';

/**
 * Internal executor representation.
 */
interface Executor {
  id: string;
  execute: ExecutorFunction;
}

/**
 * Internal edge representation.
 */
interface Edge {
  from: string;
  to: string;
  condition?: (result: unknown) => boolean | Promise<boolean>;
}

/**
 * Implementation of WorkflowContext.
 */
class WorkflowContextImpl implements WorkflowContext {
  private outputs: unknown[] = [];
  private state: Map<string, unknown> = new Map();

  output(value: unknown): void {
    this.outputs.push(value);
  }

  getState<T = unknown>(key: string): T | undefined {
    return this.state.get(key) as T | undefined;
  }

  setState<T = unknown>(key: string, value: T): void {
    this.state.set(key, value);
  }

  hasState(key: string): boolean {
    return this.state.has(key);
  }

  clearState(key: string): void {
    this.state.delete(key);
  }

  getOutputs(): unknown[] {
    return [...this.outputs];
  }

  reset(): void {
    this.outputs = [];
    this.state.clear();
  }
}

/**
 * Workflow execution engine.
 */
export class Workflow {
  private readonly id: string;
  private readonly name?: string;
  private readonly description?: string;
  private readonly startExecutorId: string;
  private readonly executors: Map<string, Executor>;
  private readonly edges: Edge[];
  private readonly maxIterations: number;

  constructor(config: WorkflowConfig) {
    this.id = config.id || this.generateId();
    this.name = config.name;
    this.description = config.description;
    this.startExecutorId = config.startExecutor;
    this.maxIterations = config.maxIterations || 100;
    
    // Convert executor configs to internal format
    this.executors = new Map();
    for (const [id, executorConfig] of Object.entries(config.executors)) {
      this.executors.set(id, this.createExecutor(id, executorConfig));
    }
    
    // Validate that start executor exists
    if (!this.executors.has(this.startExecutorId)) {
      throw new Error(`Start executor "${this.startExecutorId}" not found in executors`);
    }
    
    // Convert edge configs to internal format
    this.edges = config.edges.map(edge => ({
      from: edge.from,
      to: edge.to,
      condition: edge.condition,
    }));
    
    // Validate edges
    this.validateEdges();
  }

  private generateId(): string {
    return `workflow-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
  }

  private createExecutor(id: string, config: ExecutorConfig): Executor {
    // Check if it's a function
    if (typeof config === 'function') {
      return {
        id,
        execute: config,
      };
    }
    
    // It's an agent executor config
    const agentConfig = config as AgentExecutorConfig;
    const agent = agentConfig.agent;
    
    return {
      id,
      execute: async (input: unknown, context: WorkflowContext) => {
        // Prepare the prompt
        let prompt: string | ChatMessage | ChatMessage[];
        
        if (agentConfig.promptTemplate) {
          if (typeof agentConfig.promptTemplate === 'function') {
            prompt = agentConfig.promptTemplate(input);
          } else {
            // Simple string template - replace {input} placeholder
            const template = agentConfig.promptTemplate;
            prompt = template.replace(/\{input\}/g, String(input));
          }
        } else {
          // Use input directly
          prompt = String(input);
        }
        
        // Run the agent
        const response = await agent.run(prompt);
        
        // Automatically output the response
        context.output(response.text || '');
        
        return response.text || '';
      },
    };
  }

  private validateEdges(): void {
    // Check that all edges reference existing executors
    for (const edge of this.edges) {
      if (!this.executors.has(edge.from)) {
        throw new Error(`Edge references non-existent source executor: ${edge.from}`);
      }
      if (!this.executors.has(edge.to)) {
        throw new Error(`Edge references non-existent target executor: ${edge.to}`);
      }
    }
  }

  private getNextExecutors(currentId: string, result: unknown): Promise<string[]> {
    const outgoingEdges = this.edges.filter(e => e.from === currentId);
    
    return Promise.all(
      outgoingEdges.map(async edge => {
        if (edge.condition) {
          const shouldFollow = await edge.condition(result);
          return shouldFollow ? edge.to : null;
        }
        return edge.to;
      })
    ).then(executors => executors.filter((id): id is string => id !== null));
  }

  /**
   * Run the workflow with the given input.
   * @param input - Initial input to the workflow
   * @returns The workflow run result
   */
  async run(input: unknown): Promise<WorkflowRunResult> {
    const events: WorkflowEventType[] = [];
    const context = new WorkflowContextImpl();
    
    // Emit start event
    events.push({
      type: 'workflow.started',
      timestamp: Date.now(),
    });
    
    try {
      await this.executeWorkflow(input, context, events);
      
      // Emit completion event
      events.push({
        type: 'workflow.completed',
        timestamp: Date.now(),
      });
      
      return {
        state: WorkflowRunState.Idle,
        events,
        outputs: context.getOutputs(),
      };
    } catch (error) {
      // Emit failed event
      events.push({
        type: 'workflow.failed',
        timestamp: Date.now(),
        error: error as Error,
      });
      
      return {
        state: WorkflowRunState.Failed,
        events,
        outputs: context.getOutputs(),
        error: error as Error,
      };
    }
  }

  /**
   * Run the workflow with streaming events.
   * @param input - Initial input to the workflow
   * @yields Workflow events as they occur
   */
  async *runStream(input: unknown): AsyncIterable<WorkflowEventType> {
    const context = new WorkflowContextImpl();
    
    // Emit start event
    yield {
      type: 'workflow.started',
      timestamp: Date.now(),
    };
    
    try {
      const events: WorkflowEventType[] = [];
      
      // Execute workflow and collect events
      await this.executeWorkflow(input, context, events);
      
      // Yield all collected events
      for (const event of events) {
        yield event;
      }
      
      // Emit completion event
      yield {
        type: 'workflow.completed',
        timestamp: Date.now(),
      };
    } catch (error) {
      // Emit failed event
      yield {
        type: 'workflow.failed',
        timestamp: Date.now(),
        error: error as Error,
      };
    }
  }

  private async executeWorkflow(
    input: unknown,
    context: WorkflowContextImpl,
    events: WorkflowEventType[]
  ): Promise<void> {
    const visited = new Set<string>();
    const queue: Array<{ executorId: string; input: unknown }> = [
      { executorId: this.startExecutorId, input },
    ];
    
    let iterations = 0;
    
    while (queue.length > 0 && iterations < this.maxIterations) {
      iterations++;
      
      const { executorId, input: currentInput } = queue.shift()!;
      
      // Skip if we've already processed this executor
      if (visited.has(executorId)) {
        continue;
      }
      
      visited.add(executorId);
      
      const executor = this.executors.get(executorId);
      if (!executor) {
        throw new Error(`Executor not found: ${executorId}`);
      }
      
      // Emit invoked event
      events.push({
        type: 'executor.invoked',
        timestamp: Date.now(),
        executorId,
      });
      
      try {
        // Execute the executor
        const result = await executor.execute(currentInput, context);
        
        // Emit completed event
        events.push({
          type: 'executor.completed',
          timestamp: Date.now(),
          executorId,
          result,
        });
        
        // Get next executors based on edges
        const nextExecutorIds = await this.getNextExecutors(executorId, result);
        
        // Add next executors to queue
        for (const nextId of nextExecutorIds) {
          queue.push({ executorId: nextId, input: result });
        }
      } catch (error) {
        // Emit failed event
        events.push({
          type: 'executor.failed',
          timestamp: Date.now(),
          executorId,
          error: error as Error,
        });
        throw error;
      }
    }
    
    if (iterations >= this.maxIterations) {
      throw new Error(`Workflow exceeded maximum iterations (${this.maxIterations})`);
    }
  }

  /**
   * Get the workflow ID.
   */
  getId(): string {
    return this.id;
  }

  /**
   * Get the workflow name.
   */
  getName(): string | undefined {
    return this.name;
  }

  /**
   * Get the workflow description.
   */
  getDescription(): string | undefined {
    return this.description;
  }
}
