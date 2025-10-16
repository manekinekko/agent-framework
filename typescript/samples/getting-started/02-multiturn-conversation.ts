import { OpenAIChatClient } from '@microsoft/agent-framework';

/**
 * Multi-turn Conversation Example
 * 
 * This sample demonstrates how to use threads to maintain conversation state
 * across multiple turns.
 */

async function main() {
  console.log('=== Multi-turn Conversation Example ===\n');

  // Create a client and agent
  const client = new OpenAIChatClient({
    apiKey: process.env.OPENAI_API_KEY,
  });

  const agent = client.createAgent({
    name: 'Assistant',
    instructions: 'You are a helpful assistant. Remember information about the user.',
    model: 'gpt-4o-mini',
  });

  // Create a thread to maintain conversation state
  const thread = agent.createThread();

  // First turn
  console.log('User: Hello! My name is Alice and I love TypeScript.');
  const response1 = await agent.run('Hello! My name is Alice and I love TypeScript.', { thread });
  console.log(`Agent: ${response1.text}\n`);

  // Second turn - the agent remembers the context
  console.log('User: What is my name?');
  const response2 = await agent.run('What is my name?', { thread });
  console.log(`Agent: ${response2.text}\n`);

  // Third turn
  console.log('User: What programming language do I like?');
  const response3 = await agent.run('What programming language do I like?', { thread });
  console.log(`Agent: ${response3.text}\n`);
}

main().catch(console.error);
