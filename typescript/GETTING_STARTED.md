# Getting Started with Microsoft Agent Framework TypeScript SDK

This guide will walk you through the basics of using the Microsoft Agent Framework TypeScript SDK.

## Installation

```bash
npm install @microsoft/agent-framework
```

## Basic Concepts

### Agents

An **Agent** is the core abstraction in the framework. It represents an AI entity that can:
- Process user messages
- Maintain conversation state
- Call tools/functions
- Stream responses in real-time

### Threads

A **Thread** represents a conversation session with an agent. Threads:
- Store conversation history
- Maintain context across multiple turns
- Can be serialized and persisted

### Tools/Functions

**Tools** (or functions) extend agent capabilities by allowing them to:
- Query external APIs
- Perform calculations
- Access databases
- Execute custom logic

### Middleware

**Middleware** provides a way to add cross-cutting concerns like:
- Logging
- Error handling
- Retry logic
- Authentication

## Your First Agent

### Simple Non-Streaming Agent

```typescript
import { OpenAIChatClient } from '@microsoft/agent-framework';

// Create a client
const client = new OpenAIChatClient({
  apiKey: process.env.OPENAI_API_KEY,
});

// Create an agent
const agent = client.createAgent({
  name: 'MyAssistant',
  instructions: 'You are a helpful assistant.',
});

// Run the agent
const response = await agent.run('Hello, how are you?');
console.log(response.text);
```

### Streaming Agent

For real-time responses:

```typescript
for await (const update of agent.runStream('Tell me a story')) {
  if (update.text) {
    process.stdout.write(update.text);
  }
}
```

## Multi-Turn Conversations

Use threads to maintain context:

```typescript
// Create a thread
const thread = agent.createThread();

// First message
await agent.run('My name is Alice', { thread });

// Second message - the agent remembers
const response = await agent.run('What is my name?', { thread });
// Response: "Your name is Alice."
```

## Function Calling

### Defining a Function

```typescript
import { defineFunction, inferSchema } from '@microsoft/agent-framework';

const getWeather = defineFunction(
  'get_weather',
  'Get the current weather for a location',
  async (args) => {
    const { location } = args as { location: string };
    // Call your weather API here
    return `The weather in ${location} is sunny.`;
  },
  inferSchema({
    location: {
      type: 'string',
      description: 'The city name',
      required: true,
    },
  })
);
```

### Using Functions with an Agent

```typescript
const agent = client.createAgent({
  name: 'WeatherBot',
  instructions: 'Help users get weather information.',
  tools: [getWeather],
});

// The agent will automatically call the function when needed
const response = await agent.run('What is the weather in Seattle?');
```

## Using Azure OpenAI

### With Azure AD Authentication

```typescript
import { AzureOpenAIChatClient } from '@microsoft/agent-framework';
import { DefaultAzureCredential } from '@azure/identity';

const client = new AzureOpenAIChatClient({
  endpoint: process.env.AZURE_OPENAI_ENDPOINT!,
  deploymentName: 'gpt-4o-mini',
  credential: new DefaultAzureCredential(),
});

const agent = client.createAgent({
  name: 'AzureAssistant',
});
```

### With API Key

```typescript
const client = new AzureOpenAIChatClient({
  endpoint: process.env.AZURE_OPENAI_ENDPOINT!,
  deploymentName: 'gpt-4o-mini',
  apiKey: process.env.AZURE_OPENAI_API_KEY,
});
```

## Middleware

### Using Built-in Middleware

```typescript
import { MiddlewareAgent, createLoggingMiddleware } from '@microsoft/agent-framework';

const baseAgent = client.createAgent({ name: 'Base' });
const agent = new MiddlewareAgent(baseAgent);

// Add logging
agent.use(createLoggingMiddleware());

// Add retry logic
agent.use(createRetryMiddleware(3, 1000));
```

### Custom Middleware

```typescript
import { AgentMiddleware } from '@microsoft/agent-framework';

const customMiddleware: AgentMiddleware = async (context, next) => {
  console.log('Before:', context.messages.length, 'messages');
  
  const response = await next();
  
  console.log('After:', response.messages.length, 'new messages');
  
  return response;
};

agent.use(customMiddleware);
```

## Advanced Patterns

### Custom Message Storage

```typescript
import { ChatMessageStore, ChatMessage } from '@microsoft/agent-framework';

class DatabaseMessageStore implements ChatMessageStore {
  async addMessages(messages: ChatMessage[]): Promise<void> {
    // Store in your database
    await db.messages.insertMany(messages);
  }

  async getMessages(): Promise<ChatMessage[]> {
    // Retrieve from your database
    return await db.messages.find({}).toArray();
  }

  async clear(): Promise<void> {
    // Clear from your database
    await db.messages.deleteMany({});
  }
}

// Use with a thread
import { InMemoryAgentThread } from '@microsoft/agent-framework';
const store = new DatabaseMessageStore();
const thread = new InMemoryAgentThread(store);
```

### Response Streaming with Custom Processing

```typescript
let fullResponse = '';

for await (const update of agent.runStream('Generate a report')) {
  if (update.text) {
    fullResponse += update.text;
    
    // Process chunks as they arrive
    if (fullResponse.includes('\n')) {
      // Process complete lines
    }
  }
  
  if (update.isComplete) {
    console.log('Stream complete!');
  }
}
```

### Agent Metadata

```typescript
const agent = client.createAgent({
  name: 'SpecializedAgent',
  description: 'An agent that specializes in data analysis',
});

// Get metadata
const metadata = agent.getMetadata();
console.log(metadata.id);
console.log(metadata.name);
console.log(metadata.description);
```

## Best Practices

### 1. Error Handling

```typescript
try {
  const response = await agent.run('Hello');
  console.log(response.text);
} catch (error) {
  if (error.status === 429) {
    // Handle rate limiting
    console.error('Rate limited, retry later');
  } else {
    console.error('Error:', error.message);
  }
}
```

### 2. Environment Variables

Store sensitive information in environment variables:

```typescript
// .env file
OPENAI_API_KEY=sk-...
AZURE_OPENAI_ENDPOINT=https://...
AZURE_OPENAI_DEPLOYMENT_NAME=gpt-4o-mini

// In code
import 'dotenv/config';

const client = new OpenAIChatClient({
  apiKey: process.env.OPENAI_API_KEY,
});
```

### 3. Type Safety

Take advantage of TypeScript's type system:

```typescript
import { ChatMessage, Role, AgentRunResponse } from '@microsoft/agent-framework';

// Type your function arguments
interface WeatherArgs {
  location: string;
  units?: 'celsius' | 'fahrenheit';
}

const getWeather = defineFunction(
  'get_weather',
  'Get weather',
  async (args) => {
    const { location, units = 'celsius' } = args as WeatherArgs;
    // TypeScript knows the types now
    return `Weather in ${location}: 20°${units === 'celsius' ? 'C' : 'F'}`;
  },
  inferSchema({
    location: { type: 'string', required: true },
    units: { type: 'string', required: false },
  })
);
```

### 4. Resource Cleanup

Clean up resources when done:

```typescript
// Clear thread history when no longer needed
await thread.clear();

// For long-running applications, consider implementing
// thread lifecycle management
```

## Next Steps

- Explore the [samples directory](../samples/getting-started/) for more examples
- Read the [API documentation](./packages/core/README.md)
- Check out the [.NET](../dotnet/samples/) and [Python](../python/samples/) samples for more patterns
- Join the [Discord community](https://discord.gg/b5zjErwbQM)

## Troubleshooting

### "Cannot find module '@microsoft/agent-framework'"

Make sure the package is installed:
```bash
npm install @microsoft/agent-framework
```

### Type errors with OpenAI types

Make sure you have the right versions:
```bash
npm install openai@latest @azure/openai@latest
```

### ESM import errors

Make sure your `package.json` has:
```json
{
  "type": "module"
}
```

Or use `.mjs` file extension.

## Support

- [GitHub Issues](https://github.com/microsoft/agent-framework/issues)
- [Discord Community](https://discord.gg/b5zjErwbQM)
- [Documentation](https://learn.microsoft.com/agent-framework/)
