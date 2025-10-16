// Copyright (c) Microsoft. All rights reserved.

import OpenAI from 'openai';
import { AIAgent } from './agent.js';
import { Role } from './types.js';
import type { 
  ChatMessage, 
  AgentRunResponse, 
  AgentRunResponseUpdate,
  AgentRunOptions,
} from './types.js';
import type { AgentThread } from './thread.js';
import { InMemoryAgentThread } from './thread.js';
import type { AIFunction } from './tools.js';

/**
 * Options for creating an OpenAI chat agent.
 */
export interface OpenAIChatAgentOptions {
  /** The agent's name */
  name?: string;
  /** The agent's description */
  description?: string;
  /** System instructions for the agent */
  instructions?: string;
  /** The model to use */
  model?: string;
  /** Temperature for response generation */
  temperature?: number;
  /** Maximum tokens to generate */
  maxTokens?: number;
  /** Tools/functions available to the agent */
  tools?: AIFunction[];
}

/**
 * An AI agent that uses OpenAI's chat completion API.
 */
export class OpenAIChatAgent extends AIAgent {
  private readonly client: OpenAI;
  private readonly model: string;
  private readonly instructions?: string;
  private readonly temperature?: number;
  private readonly maxTokens?: number;
  private readonly tools: AIFunction[];

  constructor(
    client: OpenAI,
    options: OpenAIChatAgentOptions = {}
  ) {
    super({
      name: options.name,
      description: options.description,
    });
    this.client = client;
    this.model = options.model ?? 'gpt-4o-mini';
    this.instructions = options.instructions;
    this.temperature = options.temperature;
    this.maxTokens = options.maxTokens;
    this.tools = options.tools ?? [];
  }

  async run(
    input: string | ChatMessage | ChatMessage[],
    options?: AgentRunOptions & { thread?: AgentThread }
  ): Promise<AgentRunResponse> {
    const inputMessages = this.normalizeInput(input);
    const thread = options?.thread ?? this.createThread();
    
    // Get existing messages from thread if it exists
    let messages: ChatMessage[] = [];
    if (thread instanceof InMemoryAgentThread) {
      messages = await thread.getMessages();
    }

    // Add system instructions if provided
    if (this.instructions && messages.length === 0) {
      messages.unshift({
        role: Role.System,
        content: this.instructions,
      });
    }

    // Add new input messages
    messages.push(...inputMessages);

    // Convert to OpenAI format
    const openaiMessages = this.convertToOpenAIMessages(messages);

    // Prepare tools if any
    const toolDefs = this.tools.length > 0
      ? this.tools.map(tool => ({
          type: 'function' as const,
          function: tool.definition,
        }))
      : undefined;

    // Make the API call
    const completion = await this.client.chat.completions.create({
      model: this.model,
      messages: openaiMessages,
      temperature: this.temperature,
      max_tokens: this.maxTokens,
      tools: toolDefs,
    });

    const choice = completion.choices[0];
    const assistantMessage: ChatMessage = {
      role: Role.Assistant,
      content: choice.message.content ?? '',
    };

    // Handle tool calls
    if (choice.message.tool_calls) {
      assistantMessage.toolCalls = choice.message.tool_calls.map(tc => ({
        id: tc.id,
        type: 'function' as const,
        function: {
          name: tc.function.name,
          arguments: tc.function.arguments,
        },
      }));

      messages.push(assistantMessage);

      // Execute tool calls
      const toolResults: ChatMessage[] = [];
      for (const toolCall of choice.message.tool_calls) {
        const tool = this.tools.find(t => t.definition.name === toolCall.function.name);
        if (tool) {
          const args = JSON.parse(toolCall.function.arguments);
          const result = await tool.invoke(args);
          toolResults.push({
            role: Role.Tool,
            content: result,
            toolCallId: toolCall.id,
          });
        }
      }

      messages.push(...toolResults);

      // Make another call to get the final response
      const finalCompletion = await this.client.chat.completions.create({
        model: this.model,
        messages: this.convertToOpenAIMessages(messages),
        temperature: this.temperature,
        max_tokens: this.maxTokens,
      });

      const finalChoice = finalCompletion.choices[0];
      const finalMessage: ChatMessage = {
        role: Role.Assistant,
        content: finalChoice.message.content ?? '',
      };

      messages.push(finalMessage);

      // Update thread
      if (thread instanceof InMemoryAgentThread) {
        await thread.addMessages([assistantMessage, ...toolResults, finalMessage]);
      }

      return {
        messages: [assistantMessage, ...toolResults, finalMessage],
        responseId: finalCompletion.id,
        text: finalMessage.content,
        usage: finalCompletion.usage
          ? {
              promptTokens: finalCompletion.usage.prompt_tokens,
              completionTokens: finalCompletion.usage.completion_tokens,
              totalTokens: finalCompletion.usage.total_tokens,
            }
          : undefined,
      };
    }

    messages.push(assistantMessage);

    // Update thread
    if (thread instanceof InMemoryAgentThread) {
      await thread.addMessages([assistantMessage]);
    }

    return {
      messages: [assistantMessage],
      responseId: completion.id,
      text: assistantMessage.content,
      usage: completion.usage
        ? {
            promptTokens: completion.usage.prompt_tokens,
            completionTokens: completion.usage.completion_tokens,
            totalTokens: completion.usage.total_tokens,
          }
        : undefined,
    };
  }

  async *runStream(
    input: string | ChatMessage | ChatMessage[],
    options?: AgentRunOptions & { thread?: AgentThread }
  ): AsyncIterable<AgentRunResponseUpdate> {
    const inputMessages = this.normalizeInput(input);
    const thread = options?.thread ?? this.createThread();
    
    // Get existing messages from thread
    let messages: ChatMessage[] = [];
    if (thread instanceof InMemoryAgentThread) {
      messages = await thread.getMessages();
    }

    // Add system instructions if provided
    if (this.instructions && messages.length === 0) {
      messages.unshift({
        role: Role.System,
        content: this.instructions,
      });
    }

    // Add new input messages
    messages.push(...inputMessages);

    // Convert to OpenAI format
    const openaiMessages = this.convertToOpenAIMessages(messages);

    // Prepare tools if any
    const toolDefs = this.tools.length > 0
      ? this.tools.map(tool => ({
          type: 'function' as const,
          function: tool.definition,
        }))
      : undefined;

    // Make the streaming API call
    const stream = await this.client.chat.completions.create({
      model: this.model,
      messages: openaiMessages,
      temperature: this.temperature,
      max_tokens: this.maxTokens,
      tools: toolDefs,
      stream: true,
    });

    let fullContent = '';
    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta;
      if (delta?.content) {
        fullContent += delta.content;
        yield {
          text: delta.content,
          isComplete: false,
        };
      }
    }

    // Update thread with the complete message
    const assistantMessage: ChatMessage = {
      role: Role.Assistant,
      content: fullContent,
    };

    if (thread instanceof InMemoryAgentThread) {
      await thread.addMessages([assistantMessage]);
    }

    yield {
      text: '',
      messages: [assistantMessage],
      isComplete: true,
    };
  }

  private convertToOpenAIMessages(messages: ChatMessage[]): OpenAI.Chat.ChatCompletionMessageParam[] {
    return messages.map(msg => {
      if (msg.role === 'tool') {
        return {
          role: 'tool',
          content: msg.content,
          tool_call_id: msg.toolCallId!,
        };
      }

      if (msg.toolCalls) {
        return {
          role: 'assistant',
          content: msg.content || null,
          tool_calls: msg.toolCalls.map(tc => ({
            id: tc.id,
            type: 'function' as const,
            function: {
              name: tc.function.name,
              arguments: tc.function.arguments,
            },
          })),
        };
      }

      return {
        role: msg.role,
        content: msg.content,
        name: msg.name,
      } as OpenAI.Chat.ChatCompletionMessageParam;
    });
  }
}

/**
 * Client for creating OpenAI chat agents.
 */
export class OpenAIChatClient {
  private readonly client: OpenAI;

  constructor(options?: {
    apiKey?: string;
    baseURL?: string;
    organization?: string;
  }) {
    this.client = new OpenAI({
      apiKey: options?.apiKey ?? process.env.OPENAI_API_KEY,
      baseURL: options?.baseURL,
      organization: options?.organization,
    });
  }

  /**
   * Creates a new chat agent.
   * @param options - Options for the agent
   * @returns A new OpenAIChatAgent
   */
  createAgent(options: OpenAIChatAgentOptions = {}): OpenAIChatAgent {
    return new OpenAIChatAgent(this.client, options);
  }
}
