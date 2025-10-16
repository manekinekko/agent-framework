// Copyright (c) Microsoft. All rights reserved.

/**
 * JSON Schema type definition for tool parameters.
 */
export interface JSONSchema {
  type?: string;
  properties?: Record<string, JSONSchema>;
  required?: string[];
  items?: JSONSchema;
  description?: string;
  enum?: unknown[];
  [key: string]: unknown;
}

/**
 * Definition of a function/tool that can be called by an agent.
 */
export interface FunctionDefinition {
  /** The name of the function */
  name: string;
  /** A description of what the function does */
  description: string;
  /** JSON Schema describing the function parameters */
  parameters: JSONSchema;
}

/**
 * A function/tool that can be invoked by an agent.
 */
export interface AIFunction {
  /** The function definition */
  definition: FunctionDefinition;
  
  /**
   * Invokes the function with the given arguments.
   * @param args - The function arguments as a JSON object
   * @returns The function result as a string
   */
  invoke(args: Record<string, unknown>): Promise<string>;
}

/**
 * Creates an AIFunction from a TypeScript function.
 * @param fn - The function to wrap
 * @param definition - The function definition
 * @returns An AIFunction that wraps the provided function
 */
export function createFunction(
  fn: (args: Record<string, unknown>) => Promise<string> | string,
  definition: FunctionDefinition
): AIFunction {
  return {
    definition,
    async invoke(args: Record<string, unknown>): Promise<string> {
      const result = await fn(args);
      return typeof result === 'string' ? result : JSON.stringify(result);
    },
  };
}

/**
 * Infers a JSON Schema from a TypeScript type annotation or function signature.
 * This is a simplified version - in practice, you might use a library like zod or typescript-json-schema.
 * @param params - Parameter definitions
 * @returns A JSON Schema
 */
export function inferSchema(params: {
  [key: string]: {
    type: 'string' | 'number' | 'boolean' | 'object' | 'array';
    description?: string;
    required?: boolean;
  };
}): JSONSchema {
  const properties: Record<string, JSONSchema> = {};
  const required: string[] = [];

  for (const [key, param] of Object.entries(params)) {
    properties[key] = {
      type: param.type,
      description: param.description,
    };
    if (param.required !== false) {
      required.push(key);
    }
  }

  return {
    type: 'object',
    properties,
    required,
  };
}

/**
 * Creates an AIFunction from a simple TypeScript function with automatic schema inference.
 * @param name - The function name
 * @param description - The function description
 * @param fn - The function implementation
 * @param schema - The parameter schema
 * @returns An AIFunction
 */
export function defineFunction(
  name: string,
  description: string,
  fn: (args: Record<string, unknown>) => Promise<string> | string,
  schema: JSONSchema
): AIFunction {
  return createFunction(fn, {
    name,
    description,
    parameters: schema,
  });
}
