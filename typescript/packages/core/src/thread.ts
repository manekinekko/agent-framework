// Copyright (c) Microsoft. All rights reserved.

import type { ChatMessage } from './types.js';
import type { ChatMessageStore } from './message-store.js';
import { InMemoryChatMessageStore } from './message-store.js';

/**
 * Metadata about an agent thread.
 */
export interface AgentThreadMetadata {
  /** Additional properties for the thread */
  [key: string]: unknown;
}

/**
 * Base abstraction for all agent threads.
 * 
 * An AgentThread contains the state of a specific conversation with an agent which may include:
 * - Conversation history or a reference to externally stored conversation history
 * - Memories or a reference to externally stored memories
 * - Any other state that the agent needs to persist across runs for a conversation
 * 
 * An AgentThread may also have behaviors attached to it that may include:
 * - Customized storage of state
 * - Data extraction from and injection into a conversation
 * - Chat history reduction (e.g., summarization or truncation)
 */
export abstract class AgentThread {
  /**
   * Called when new messages have been contributed to the chat.
   * Inheritors can use this method to update their context based on the new messages.
   * @param newMessages - The new messages
   */
  protected async onMessagesReceived(_newMessages: ChatMessage[]): Promise<void> {
    // Default implementation does nothing
  }

  /**
   * Serializes the thread state to a JSON-compatible object.
   * @returns The serialized thread state
   */
  serialize(): Record<string, unknown> {
    return {};
  }

  /**
   * Notifies the thread that new messages were received.
   * @internal
   */
  async notifyMessagesReceived(messages: ChatMessage[]): Promise<void> {
    await this.onMessagesReceived(messages);
  }
}

/**
 * In-memory implementation of AgentThread.
 * Stores conversation history in memory using a ChatMessageStore.
 */
export class InMemoryAgentThread extends AgentThread {
  private readonly messageStore: ChatMessageStore;
  public readonly metadata: AgentThreadMetadata;

  constructor(
    messageStore?: ChatMessageStore,
    metadata: AgentThreadMetadata = {}
  ) {
    super();
    this.messageStore = messageStore ?? new InMemoryChatMessageStore();
    this.metadata = metadata;
  }

  /**
   * Gets all messages in the thread.
   */
  async getMessages(): Promise<ChatMessage[]> {
    return this.messageStore.getMessages();
  }

  /**
   * Adds messages to the thread.
   */
  async addMessages(messages: ChatMessage[]): Promise<void> {
    await this.messageStore.addMessages(messages);
    await this.notifyMessagesReceived(messages);
  }

  /**
   * Clears all messages from the thread.
   */
  async clear(): Promise<void> {
    await this.messageStore.clear();
  }

  override serialize(): Record<string, unknown> {
    return {
      type: 'InMemoryAgentThread',
      metadata: this.metadata,
    };
  }
}
