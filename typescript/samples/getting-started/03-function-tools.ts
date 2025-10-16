import { OpenAIChatClient, defineFunction, inferSchema } from '@microsoft/agent-framework';

/**
 * Function Tools Example
 * 
 * This sample demonstrates how to use function/tool calling to extend agent capabilities.
 */

// Define some example functions
const getWeather = defineFunction(
  'get_weather',
  'Get the current weather for a location',
  async (args) => {
    const { location } = args as { location: string };
    // Simulate a weather API call
    const conditions = ['sunny', 'cloudy', 'rainy', 'stormy'];
    const condition = conditions[Math.floor(Math.random() * conditions.length)];
    const temp = Math.floor(Math.random() * 20) + 10;
    return `The weather in ${location} is ${condition} with a temperature of ${temp}°C.`;
  },
  inferSchema({
    location: {
      type: 'string',
      description: 'The city and country, e.g. "Seattle, WA"',
      required: true,
    },
  })
);

const getTime = defineFunction(
  'get_time',
  'Get the current time',
  async () => {
    return new Date().toLocaleTimeString();
  },
  inferSchema({})
);

async function main() {
  console.log('=== Function Tools Example ===\n');

  // Create a client
  const client = new OpenAIChatClient({
    apiKey: process.env.OPENAI_API_KEY,
  });

  // Create an agent with tools
  const agent = client.createAgent({
    name: 'WeatherBot',
    instructions: 'You are a helpful assistant that can check the weather and tell the time.',
    model: 'gpt-4o-mini',
    tools: [getWeather, getTime],
  });

  // Example 1: Weather query
  console.log('User: What is the weather like in Seattle?');
  const response1 = await agent.run('What is the weather like in Seattle?');
  console.log(`Agent: ${response1.text}\n`);

  // Example 2: Time query
  console.log('User: What time is it?');
  const response2 = await agent.run('What time is it?');
  console.log(`Agent: ${response2.text}\n`);

  // Example 3: Multiple queries
  console.log('User: What is the weather in Paris and what time is it?');
  const response3 = await agent.run('What is the weather in Paris and what time is it?');
  console.log(`Agent: ${response3.text}\n`);
}

main().catch(console.error);
