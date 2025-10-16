// Copyright (c) Microsoft. All rights reserved.

import type { ChatMessage } from './types.js';

/**
 * Protocol for storing and retrieving chat messages.
 * Implementations can use in-memory storage, databases, or external services.
 */
export interface ChatMessageStore {
  /**
   * Adds new messages to the store.
   * @param messages - The messages to add
   */
  addMessages(messages: ChatMessage[]): Promise<void>;

  /**
   * Retrieves all messages from the store.
   * @returns All stored messages
   */
  getMessages(): Promise<ChatMessage[]>;

  /**
   * Clears all messages from the store.
   */
  clear(): Promise<void>;
}

/**
 * In-memory implementation of ChatMessageStore.
 * Messages are stored in memory and will be lost when the process ends.
 */
export class InMemoryChatMessageStore implements ChatMessageStore {
  private messages: ChatMessage[] = [];

  async addMessages(messages: ChatMessage[]): Promise<void> {
    this.messages.push(...messages);
  }

  async getMessages(): Promise<ChatMessage[]> {
    return [...this.messages];
  }

  async clear(): Promise<void> {
    this.messages = [];
  }
}
