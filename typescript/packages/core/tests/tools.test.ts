// Copyright (c) Microsoft. All rights reserved.

import { describe, it, expect } from 'vitest';
import { defineFunction, inferSchema } from '../src/tools.js';

describe('Tools', () => {
  describe('inferSchema', () => {
    it('should infer schema from parameter definitions', () => {
      const schema = inferSchema({
        location: {
          type: 'string',
          description: 'The location',
          required: true,
        },
        units: {
          type: 'string',
          description: 'Temperature units',
          required: false,
        },
      });

      expect(schema.type).toBe('object');
      expect(schema.properties).toHaveProperty('location');
      expect(schema.properties).toHaveProperty('units');
      expect(schema.required).toEqual(['location']);
    });

    it('should handle all required parameters', () => {
      const schema = inferSchema({
        name: { type: 'string', required: true },
        age: { type: 'number', required: true },
      });

      expect(schema.required).toEqual(['name', 'age']);
    });

    it('should handle no required parameters', () => {
      const schema = inferSchema({
        name: { type: 'string', required: false },
      });

      expect(schema.required).toEqual([]);
    });
  });

  describe('defineFunction', () => {
    it('should create a function with the correct definition', () => {
      const fn = defineFunction(
        'get_weather',
        'Get the weather',
        async () => 'Sunny',
        inferSchema({
          location: { type: 'string', required: true },
        })
      );

      expect(fn.definition.name).toBe('get_weather');
      expect(fn.definition.description).toBe('Get the weather');
      expect(fn.definition.parameters.type).toBe('object');
    });

    it('should invoke the function', async () => {
      const fn = defineFunction(
        'add',
        'Add two numbers',
        async (args) => {
          const { a, b } = args as { a: number; b: number };
          return (a + b).toString();
        },
        inferSchema({
          a: { type: 'number', required: true },
          b: { type: 'number', required: true },
        })
      );

      const result = await fn.invoke({ a: 2, b: 3 });
      expect(result).toBe('5');
    });

    it('should handle async functions', async () => {
      const fn = defineFunction(
        'delay',
        'Wait and return',
        async (args) => {
          const { message } = args as { message: string };
          await new Promise(resolve => setTimeout(resolve, 10));
          return message;
        },
        inferSchema({
          message: { type: 'string', required: true },
        })
      );

      const result = await fn.invoke({ message: 'Hello' });
      expect(result).toBe('Hello');
    });

    it('should handle sync functions', async () => {
      const fn = defineFunction(
        'echo',
        'Echo a message',
        (args) => {
          const { message } = args as { message: string };
          return message;
        },
        inferSchema({
          message: { type: 'string', required: true },
        })
      );

      const result = await fn.invoke({ message: 'Hello' });
      expect(result).toBe('Hello');
    });
  });
});
