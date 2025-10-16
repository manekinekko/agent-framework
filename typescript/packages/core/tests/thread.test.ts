// Copyright (c) Microsoft. All rights reserved.

import { describe, it, expect, beforeEach } from 'vitest';
import { InMemoryAgentThread } from '../src/thread.js';
import { InMemoryChatMessageStore } from '../src/message-store.js';
import { Role } from '../src/types.js';
import type { ChatMessage } from '../src/types.js';

describe('InMemoryAgentThread', () => {
  let thread: InMemoryAgentThread;

  beforeEach(() => {
    thread = new InMemoryAgentThread();
  });

  it('should create with empty messages', async () => {
    const messages = await thread.getMessages();
    expect(messages).toEqual([]);
  });

  it('should add messages', async () => {
    const message: ChatMessage = {
      role: Role.User,
      content: 'Hello',
    };

    await thread.addMessages([message]);
    const messages = await thread.getMessages();

    expect(messages).toHaveLength(1);
    expect(messages[0]).toEqual(message);
  });

  it('should clear messages', async () => {
    await thread.addMessages([
      { role: Role.User, content: 'Hello' },
    ]);

    await thread.clear();
    const messages = await thread.getMessages();

    expect(messages).toEqual([]);
  });

  it('should serialize with metadata', () => {
    const metadata = { userId: '123', sessionId: 'abc' };
    const thread = new InMemoryAgentThread(undefined, metadata);

    const serialized = thread.serialize();

    expect(serialized.type).toBe('InMemoryAgentThread');
    expect(serialized.metadata).toEqual(metadata);
  });

  it('should use custom message store', async () => {
    const store = new InMemoryChatMessageStore();
    const thread = new InMemoryAgentThread(store);

    const message: ChatMessage = {
      role: Role.User,
      content: 'Hello',
    };

    await thread.addMessages([message]);
    
    // Verify the custom store was used
    const storeMessages = await store.getMessages();
    expect(storeMessages).toHaveLength(1);
    expect(storeMessages[0]).toEqual(message);
  });

  it('should notify when messages are received', async () => {
    let notified = false;

    class TestThread extends InMemoryAgentThread {
      protected override async onMessagesReceived(_messages: ChatMessage[]): Promise<void> {
        notified = true;
      }
    }

    const thread = new TestThread();
    await thread.addMessages([{ role: Role.User, content: 'Test' }]);

    expect(notified).toBe(true);
  });
});
