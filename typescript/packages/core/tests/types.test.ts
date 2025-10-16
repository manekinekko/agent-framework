// Copyright (c) Microsoft. All rights reserved.

import { describe, it, expect } from 'vitest';
import { Role } from '../src/types.js';
import type { ChatMessage } from '../src/types.js';

describe('Types', () => {
  describe('Role', () => {
    it('should have correct enum values', () => {
      expect(Role.System).toBe('system');
      expect(Role.User).toBe('user');
      expect(Role.Assistant).toBe('assistant');
      expect(Role.Tool).toBe('tool');
    });
  });

  describe('ChatMessage', () => {
    it('should accept a basic message', () => {
      const message: ChatMessage = {
        role: Role.User,
        content: 'Hello, world!',
      };

      expect(message.role).toBe(Role.User);
      expect(message.content).toBe('Hello, world!');
    });

    it('should accept optional fields', () => {
      const message: ChatMessage = {
        role: Role.User,
        content: 'Hello',
        name: 'Alice',
      };

      expect(message.name).toBe('Alice');
    });

    it('should accept tool calls', () => {
      const message: ChatMessage = {
        role: Role.Assistant,
        content: '',
        toolCalls: [
          {
            id: 'call-123',
            type: 'function',
            function: {
              name: 'get_weather',
              arguments: '{"location": "Seattle"}',
            },
          },
        ],
      };

      expect(message.toolCalls).toHaveLength(1);
      expect(message.toolCalls![0].function.name).toBe('get_weather');
    });

    it('should accept tool response', () => {
      const message: ChatMessage = {
        role: Role.Tool,
        content: 'The weather is sunny',
        toolCallId: 'call-123',
      };

      expect(message.toolCallId).toBe('call-123');
    });
  });
});
