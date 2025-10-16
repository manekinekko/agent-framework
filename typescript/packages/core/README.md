# Microsoft Agent Framework for TypeScript/JavaScript

[![npm version](https://badge.fury.io/js/%40microsoft%2Fagent-framework.svg)](https://www.npmjs.com/package/@microsoft/agent-framework)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Microsoft's comprehensive TypeScript/JavaScript framework for building, orchestrating, and deploying AI agents. This package provides everything from simple chat agents to complex multi-agent workflows.

## Features

- **🤖 Multiple Agent Providers**: Support for OpenAI, Azure OpenAI, and more
- **💬 Conversation Management**: Built-in thread management and message storage
- **🔧 Function/Tool Calling**: Easy integration of custom tools and functions
- **🔄 Streaming Support**: Real-time streaming responses
- **🎯 Middleware System**: Flexible request/response processing
- **📊 OpenTelemetry Integration**: Built-in observability and tracing ✨ NEW
- **🌊 Workflow Orchestration**: Multi-agent workflows with HandOff patterns ✨ NEW
- **💪 TypeScript First**: Full TypeScript support with excellent type inference

## Installation

```bash
npm install @microsoft/agent-framework
# or
yarn add @microsoft/agent-framework
# or
pnpm add @microsoft/agent-framework
```

## Quick Start

### Basic Agent with OpenAI

```typescript
import { OpenAIChatClient } from '@microsoft/agent-framework';

// Create a client
const client = new OpenAIChatClient({
  apiKey: process.env.OPENAI_API_KEY,
});

// Create an agent
const agent = client.createAgent({
  name: 'HaikuBot',
  instructions: 'You are an upbeat assistant that writes beautifully.',
  model: 'gpt-4o-mini',
});

// Run the agent
const response = await agent.run('Write a haiku about TypeScript.');
console.log(response.text);
```

### Basic Agent with Azure OpenAI

```typescript
import { AzureOpenAIChatClient } from '@microsoft/agent-framework';
import { DefaultAzureCredential } from '@azure/identity';

// Create a client
const client = new AzureOpenAIChatClient({
  endpoint: process.env.AZURE_OPENAI_ENDPOINT!,
  deploymentName: process.env.AZURE_OPENAI_DEPLOYMENT_NAME!,
  credential: new DefaultAzureCredential(),
});

// Create an agent
const agent = client.createAgent({
  name: 'HaikuBot',
  instructions: 'You are an upbeat assistant that writes beautifully.',
});

// Run the agent
const response = await agent.run('Write a haiku about Azure.');
console.log(response.text);
```

### Streaming Responses

```typescript
const agent = client.createAgent({
  name: 'Assistant',
  instructions: 'You are a helpful assistant.',
});

// Stream responses
for await (const update of agent.runStream('Tell me a story')) {
  if (update.text) {
    process.stdout.write(update.text);
  }
}
```

### Multi-turn Conversations

```typescript
// Create a thread to maintain conversation state
const thread = agent.createThread();

// First message
await agent.run('Hello! My name is Alice.', { thread });

// Second message - the agent remembers the context
const response = await agent.run('What is my name?', { thread });
console.log(response.text); // "Your name is Alice."
```

### Using Function Tools

```typescript
import { defineFunction, inferSchema } from '@microsoft/agent-framework';

// Define a function
const getWeather = defineFunction(
  'get_weather',
  'Get the weather for a location',
  async (args) => {
    const { location } = args as { location: string };
    // In a real app, you'd call a weather API
    return `The weather in ${location} is sunny with a high of 72°F.`;
  },
  inferSchema({
    location: {
      type: 'string',
      description: 'The location to get weather for',
      required: true,
    },
  })
);

// Create an agent with tools
const agent = client.createAgent({
  name: 'WeatherBot',
  instructions: 'You help users get weather information.',
  tools: [getWeather],
});

// The agent will automatically call the function when needed
const response = await agent.run('What is the weather in Seattle?');
console.log(response.text);
```

### Using Middleware

```typescript
import { MiddlewareAgent, createLoggingMiddleware } from '@microsoft/agent-framework';

// Create a base agent
const baseAgent = client.createAgent({
  name: 'Assistant',
  instructions: 'You are a helpful assistant.',
});

// Wrap with middleware
const agent = new MiddlewareAgent(baseAgent);
agent.use(createLoggingMiddleware());

// Requests will now be logged
await agent.run('Hello!');
```

## Advanced Usage

### Custom Message Storage

```typescript
import { ChatMessageStore, ChatMessage } from '@microsoft/agent-framework';

class DatabaseMessageStore implements ChatMessageStore {
  async addMessages(messages: ChatMessage[]): Promise<void> {
    // Store messages in your database
  }

  async getMessages(): Promise<ChatMessage[]> {
    // Retrieve messages from your database
    return [];
  }

  async clear(): Promise<void> {
    // Clear messages from your database
  }
}

// Use custom storage with a thread
import { InMemoryAgentThread } from '@microsoft/agent-framework';
const store = new DatabaseMessageStore();
const thread = new InMemoryAgentThread(store);
```

### Custom Middleware

```typescript
import { AgentMiddleware } from '@microsoft/agent-framework';

const customMiddleware: AgentMiddleware = async (context, next) => {
  console.log('Before agent call');
  const response = await next();
  console.log('After agent call');
  return response;
};

agent.use(customMiddleware);
```

### Workflows and HandOff Pattern ✨ NEW

Create multi-agent workflows where agents hand off control to each other:

```typescript
import { createHandOffWorkflow } from '@microsoft/agent-framework';

// Create specialized agents
const writerAgent = client.createAgent({
  name: 'writer',
  instructions: 'You are an excellent content writer.',
});

const reviewerAgent = client.createAgent({
  name: 'reviewer',
  instructions: 'You review and provide feedback on content.',
});

const editorAgent = client.createAgent({
  name: 'editor',
  instructions: 'You polish content based on feedback.',
});

// Create a sequential HandOff workflow
const workflow = createHandOffWorkflow([
  writerAgent,
  reviewerAgent,
  editorAgent,
]);

// Run the workflow
const result = await workflow.run('Create a product description');
console.log('Outputs:', result.outputs);
```

Build custom workflows with conditional routing:

```typescript
import { WorkflowBuilder } from '@microsoft/agent-framework';

const workflow = new WorkflowBuilder()
  .setName('Customer Support')
  .setStartExecutor('classifier')
  .addExecutor('classifier', classifierAgent)
  .addExecutor('technical', technicalAgent)
  .addExecutor('billing', billingAgent)
  // Route based on classification
  .addEdge('classifier', 'technical', async (result) => {
    return String(result).includes('technical');
  })
  .addEdge('classifier', 'billing', async (result) => {
    return String(result).includes('billing');
  })
  .build();

const result = await workflow.run('My app keeps crashing');
```

### OpenTelemetry Observability ✨ NEW

Add comprehensive observability to your agents:

```typescript
import { useObservability, setupObservability } from '@microsoft/agent-framework';

// Configure observability
setupObservability({
  enabled: true,
  captureMessageContent: false, // Be careful with sensitive data
});

// Wrap your agent with observability
const agent = client.createAgent({
  name: 'ObservableAgent',
  instructions: 'You are a helpful assistant.',
});

const observableAgent = useObservability(agent);

// All agent calls now emit OpenTelemetry spans
const response = await observableAgent.run('Hello!');
```

Create custom spans for application logic:

```typescript
import { getTracer, OtelAttr } from '@microsoft/agent-framework';

const tracer = getTracer();

await tracer.startActiveSpan('my_operation', async (span) => {
  span.setAttribute('custom.attribute', 'value');
  
  // Agent call becomes a child span
  const response = await observableAgent.run('Process this');
  
  span.setStatus({ code: SpanStatusCode.OK });
  span.end();
});
```

## Examples

See the [samples directory](../../samples/getting-started) for more examples:

- Basic agent usage
- Multi-turn conversations
- Function calling
- Workflows and HandOff patterns ✨
- OpenTelemetry observability ✨
- Streaming responses
- Middleware
- Custom storage

## API Reference

### Core Classes

- `AIAgent` - Base class for all agents
- `OpenAIChatClient` - Client for creating OpenAI agents
- `AzureOpenAIChatClient` - Client for creating Azure OpenAI agents
- `AgentThread` - Manages conversation state
- `MiddlewareAgent` - Agent with middleware support

### Types

- `ChatMessage` - A message in a conversation
- `AgentRunResponse` - Response from an agent run
- `AgentRunResponseUpdate` - Streaming update from an agent
- `AIFunction` - A function/tool that can be called by an agent

## Requirements

- Node.js 18 or higher
- TypeScript 5.0 or higher (for TypeScript projects)

## License

MIT - See [LICENSE](../../../LICENSE) for details.

## Contributing

See [CONTRIBUTING.md](../../../CONTRIBUTING.md) for contribution guidelines.

## Support

For bugs and feature requests, please file a [GitHub issue](https://github.com/microsoft/agent-framework/issues).

## Learn More

- [Documentation](https://learn.microsoft.com/agent-framework/)
- [Python SDK](../../python)
- [.NET SDK](../../dotnet)
- [Samples](../../samples)
