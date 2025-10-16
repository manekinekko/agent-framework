import { OpenAIChatClient } from '@microsoft/agent-framework';

/**
 * Basic OpenAI Chat Agent Example
 * 
 * This sample demonstrates the most basic usage of the OpenAI chat agent.
 * It shows both non-streaming and streaming responses.
 */

async function nonStreamingExample() {
  console.log('=== Non-streaming Response Example ===');

  // Create a client
  const client = new OpenAIChatClient({
    apiKey: process.env.OPENAI_API_KEY,
  });

  // Create an agent
  const agent = client.createAgent({
    name: 'JokeBot',
    instructions: 'You are good at telling jokes.',
    model: 'gpt-4o-mini',
  });

  // Run the agent
  const query = 'Tell me a joke about a pirate.';
  console.log(`User: ${query}`);
  
  const response = await agent.run(query);
  console.log(`Agent: ${response.text}\n`);
}

async function streamingExample() {
  console.log('=== Streaming Response Example ===');

  const client = new OpenAIChatClient({
    apiKey: process.env.OPENAI_API_KEY,
  });

  const agent = client.createAgent({
    name: 'JokeBot',
    instructions: 'You are good at telling jokes.',
    model: 'gpt-4o-mini',
  });

  const query = 'Tell me a joke about a programmer.';
  console.log(`User: ${query}`);
  console.log('Agent: ', );
  
  // Stream the response
  for await (const update of agent.runStream(query)) {
    if (update.text) {
      process.stdout.write(update.text);
    }
  }
  console.log('\n');
}

async function main() {
  console.log('=== Basic OpenAI Chat Agent Example ===\n');
  
  await nonStreamingExample();
  await streamingExample();
}

main().catch(console.error);
