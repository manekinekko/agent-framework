// Copyright (c) Microsoft. All rights reserved.

import { describe, it, expect, beforeEach } from 'vitest';
import { InMemoryChatMessageStore } from '../src/message-store.js';
import { Role } from '../src/types.js';
import type { ChatMessage } from '../src/types.js';

describe('InMemoryChatMessageStore', () => {
  let store: InMemoryChatMessageStore;

  beforeEach(() => {
    store = new InMemoryChatMessageStore();
  });

  it('should start with empty messages', async () => {
    const messages = await store.getMessages();
    expect(messages).toEqual([]);
  });

  it('should add messages', async () => {
    const message: ChatMessage = {
      role: Role.User,
      content: 'Hello',
    };

    await store.addMessages([message]);
    const messages = await store.getMessages();

    expect(messages).toHaveLength(1);
    expect(messages[0]).toEqual(message);
  });

  it('should add multiple messages', async () => {
    const messages: ChatMessage[] = [
      { role: Role.User, content: 'Hello' },
      { role: Role.Assistant, content: 'Hi there!' },
    ];

    await store.addMessages(messages);
    const stored = await store.getMessages();

    expect(stored).toHaveLength(2);
    expect(stored).toEqual(messages);
  });

  it('should clear all messages', async () => {
    await store.addMessages([
      { role: Role.User, content: 'Hello' },
    ]);

    await store.clear();
    const messages = await store.getMessages();

    expect(messages).toEqual([]);
  });

  it('should preserve message order', async () => {
    const messages: ChatMessage[] = [
      { role: Role.User, content: 'First' },
      { role: Role.Assistant, content: 'Second' },
      { role: Role.User, content: 'Third' },
    ];

    await store.addMessages(messages);
    const stored = await store.getMessages();

    expect(stored[0].content).toBe('First');
    expect(stored[1].content).toBe('Second');
    expect(stored[2].content).toBe('Third');
  });

  it('should return a copy of messages', async () => {
    const message: ChatMessage = {
      role: Role.User,
      content: 'Hello',
    };

    await store.addMessages([message]);
    const messages1 = await store.getMessages();
    const messages2 = await store.getMessages();

    expect(messages1).not.toBe(messages2);
    expect(messages1).toEqual(messages2);
  });
});
