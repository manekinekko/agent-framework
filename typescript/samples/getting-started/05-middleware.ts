import { 
  OpenAIChatClient, 
  MiddlewareAgent, 
  createLoggingMiddleware,
  createRetryMiddleware,
  type AgentMiddleware,
} from '@microsoft/agent-framework';

/**
 * Middleware Example
 * 
 * This sample demonstrates how to use middleware to add cross-cutting concerns
 * like logging, retry logic, and custom processing.
 */

// Custom middleware that adds timing information
const timingMiddleware: AgentMiddleware = async (context, next) => {
  const startTime = Date.now();
  console.log(`[Timing] Starting request to ${context.agent.displayName}`);
  
  try {
    const response = await next();
    const duration = Date.now() - startTime;
    console.log(`[Timing] Request completed in ${duration}ms`);
    return response;
  } catch (error) {
    const duration = Date.now() - startTime;
    console.log(`[Timing] Request failed after ${duration}ms`);
    throw error;
  }
};

// Custom middleware that modifies the response
const responseModifierMiddleware: AgentMiddleware = async (context, next) => {
  const response = await next();
  
  // Add a prefix to all responses
  if (response.text) {
    response.text = `[Modified] ${response.text}`;
  }
  
  return response;
};

async function main() {
  console.log('=== Middleware Example ===\n');

  // Create a base agent
  const client = new OpenAIChatClient({
    apiKey: process.env.OPENAI_API_KEY,
  });

  const baseAgent = client.createAgent({
    name: 'Assistant',
    instructions: 'You are a helpful assistant.',
    model: 'gpt-4o-mini',
  });

  // Wrap the agent with middleware
  const agent = new MiddlewareAgent(baseAgent);
  
  // Add multiple middleware in order
  agent.use(createLoggingMiddleware());
  agent.use(timingMiddleware);
  agent.use(createRetryMiddleware(3, 1000)); // Retry up to 3 times with 1s delay
  agent.use(responseModifierMiddleware);

  // Make a request - all middleware will be applied
  console.log('User: What is 2 + 2?');
  const response = await agent.run('What is 2 + 2?');
  console.log(`Agent: ${response.text}\n`);
}

main().catch(console.error);
