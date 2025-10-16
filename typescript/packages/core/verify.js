#!/usr/bin/env node

/**
 * Simple verification script to test that the package is working correctly.
 * This script doesn't require API keys and just verifies the basic structure.
 */

import { 
  OpenAIChatClient, 
  AIAgent, 
  Role,
  InMemoryAgentThread,
  defineFunction,
  inferSchema,
  MiddlewareAgent,
  createLoggingMiddleware,
} from '@microsoft/agent-framework';

console.log('✅ All imports successful');

// Test 1: Create a client
try {
  const client = new OpenAIChatClient({ apiKey: 'test-key' });
  console.log('✅ OpenAIChatClient instantiated');
} catch (error) {
  console.error('❌ Failed to create OpenAIChatClient:', error);
  process.exit(1);
}

// Test 2: Create an agent
try {
  const client = new OpenAIChatClient({ apiKey: 'test-key' });
  const agent = client.createAgent({
    name: 'TestAgent',
    instructions: 'Test instructions',
  });
  
  console.log('✅ Agent created');
  console.log(`   - Agent ID: ${agent.id}`);
  console.log(`   - Agent Name: ${agent.name}`);
  console.log(`   - Display Name: ${agent.displayName}`);
} catch (error) {
  console.error('❌ Failed to create agent:', error);
  process.exit(1);
}

// Test 3: Create a thread
try {
  const thread = new InMemoryAgentThread({ key: 'value' });
  console.log('✅ Thread created');
  console.log(`   - Serialized:`, JSON.stringify(thread.serialize()));
} catch (error) {
  console.error('❌ Failed to create thread:', error);
  process.exit(1);
}

// Test 4: Define a function
try {
  const fn = defineFunction(
    'test_function',
    'A test function',
    async (args) => {
      return `Result: ${JSON.stringify(args)}`;
    },
    inferSchema({
      param1: { type: 'string', required: true },
    })
  );
  
  console.log('✅ Function defined');
  console.log(`   - Name: ${fn.definition.name}`);
  console.log(`   - Description: ${fn.definition.description}`);
} catch (error) {
  console.error('❌ Failed to define function:', error);
  process.exit(1);
}

// Test 5: Create middleware agent
try {
  const client = new OpenAIChatClient({ apiKey: 'test-key' });
  const baseAgent = client.createAgent({ name: 'Base' });
  const middlewareAgent = new MiddlewareAgent(baseAgent);
  middlewareAgent.use(createLoggingMiddleware(() => {})); // Silent logger
  
  console.log('✅ Middleware agent created');
} catch (error) {
  console.error('❌ Failed to create middleware agent:', error);
  process.exit(1);
}

// Test 6: Test Role enum
try {
  const message = {
    role: Role.User,
    content: 'Test message',
  };
  
  console.log('✅ Role enum works');
  console.log(`   - Role.User: ${Role.User}`);
  console.log(`   - Role.Assistant: ${Role.Assistant}`);
} catch (error) {
  console.error('❌ Failed to use Role enum:', error);
  process.exit(1);
}

console.log('\n🎉 All verification tests passed!');
console.log('The TypeScript SDK is working correctly.');
