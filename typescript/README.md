# Microsoft Agent Framework - TypeScript/JavaScript SDK

[![npm version](https://badge.fury.io/js/%40microsoft%2Fagent-framework.svg)](https://www.npmjs.com/package/@microsoft/agent-framework)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Welcome to the TypeScript/JavaScript implementation of the Microsoft Agent Framework! This SDK provides a comprehensive, idiomatic TypeScript/JavaScript interface for building AI agents.

## 📦 Installation

```bash
npm install @microsoft/agent-framework
```

## 🚀 Quick Start

```typescript
import { OpenAIChatClient } from '@microsoft/agent-framework';

const client = new OpenAIChatClient({
  apiKey: process.env.OPENAI_API_KEY,
});

const agent = client.createAgent({
  name: 'HaikuBot',
  instructions: 'You are an upbeat assistant that writes beautifully.',
  model: 'gpt-4o-mini',
});

const response = await agent.run('Write a haiku about TypeScript.');
console.log(response.text);
```

## 📚 Documentation

- **[Package Documentation](./packages/core/README.md)** - Detailed API documentation and usage guide
- **[Samples](./samples/README.md)** - Example code showing various features
- **[Main Framework Docs](https://learn.microsoft.com/agent-framework/)** - Complete framework documentation

## ✨ Features

- **🤖 Multiple Agent Providers**: OpenAI, Azure OpenAI, and more
- **💬 Conversation Management**: Thread-based conversation state management
- **🔧 Function/Tool Calling**: Easy integration of custom functions
- **🔄 Streaming Support**: Real-time streaming responses
- **🎯 Middleware System**: Flexible request/response processing
- **💪 TypeScript First**: Excellent TypeScript support and type inference
- **📦 Tree-shakeable**: Modern ESM package with minimal bundle size

## 📁 Structure

```
typescript/
├── packages/
│   └── core/              # Main package (@microsoft/agent-framework)
│       ├── src/           # Source code
│       ├── dist/          # Built output
│       └── README.md      # Package documentation
└── samples/
    └── getting-started/   # Sample code and examples
        ├── 01-basic-agent.ts
        ├── 02-multiturn-conversation.ts
        ├── 03-function-tools.ts
        ├── 04-azure-openai.ts
        └── 05-middleware.ts
```

## 🎯 Examples

### Basic Agent

```typescript
import { OpenAIChatClient } from '@microsoft/agent-framework';

const agent = new OpenAIChatClient().createAgent({
  name: 'Assistant',
  instructions: 'You are a helpful assistant.',
});

const response = await agent.run('Hello!');
console.log(response.text);
```

### Multi-turn Conversations

```typescript
const thread = agent.createThread();

await agent.run('My name is Alice.', { thread });
const response = await agent.run('What is my name?', { thread });
// Response: "Your name is Alice."
```

### Function Tools

```typescript
import { defineFunction, inferSchema } from '@microsoft/agent-framework';

const getWeather = defineFunction(
  'get_weather',
  'Get weather for a location',
  async (args) => {
    const { location } = args as { location: string };
    return `The weather in ${location} is sunny.`;
  },
  inferSchema({
    location: { type: 'string', required: true },
  })
);

const agent = client.createAgent({
  name: 'WeatherBot',
  tools: [getWeather],
});
```

### Streaming

```typescript
for await (const update of agent.runStream('Tell me a story')) {
  if (update.text) {
    process.stdout.write(update.text);
  }
}
```

### Azure OpenAI

```typescript
import { AzureOpenAIChatClient } from '@microsoft/agent-framework';
import { DefaultAzureCredential } from '@azure/identity';

const client = new AzureOpenAIChatClient({
  endpoint: process.env.AZURE_OPENAI_ENDPOINT!,
  deploymentName: 'gpt-4o-mini',
  credential: new DefaultAzureCredential(),
});

const agent = client.createAgent({
  name: 'Assistant',
});
```

## 🛠️ Development

### Building the Package

```bash
cd packages/core
npm install
npm run build
```

### Running Tests

```bash
npm test
```

### Linting

```bash
npm run lint
```

### Running Samples

```bash
cd samples
npm install
npm run 01  # Run basic agent sample
npm run 02  # Run multi-turn conversation sample
# etc.
```

## 📊 Comparison with Other SDKs

The TypeScript SDK is designed to be idiomatic for TypeScript/JavaScript developers while maintaining parity with the .NET and Python implementations:

| Feature | TypeScript | Python | .NET |
|---------|-----------|--------|------|
| Agent Abstraction | ✅ | ✅ | ✅ |
| Thread Management | ✅ | ✅ | ✅ |
| Function Tools | ✅ | ✅ | ✅ |
| Streaming | ✅ | ✅ | ✅ |
| Middleware | ✅ | ✅ | ✅ |
| OpenAI Support | ✅ | ✅ | ✅ |
| Azure OpenAI Support | ✅ | ✅ | ✅ |
| OpenTelemetry | 🚧 | ✅ | ✅ |
| Workflows | 🚧 | ✅ | ✅ |

✅ = Implemented | 🚧 = Planned

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](../CONTRIBUTING.md) for guidelines.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](../LICENSE) file for details.

## 🔗 Related Projects

- [Python SDK](../python) - Python implementation
- [.NET SDK](../dotnet) - .NET implementation
- [Main Repository](https://github.com/microsoft/agent-framework)

## 💬 Support

- For bugs and feature requests, file a [GitHub issue](https://github.com/microsoft/agent-framework/issues)
- For questions, join our [Discord](https://discord.gg/b5zjErwbQM)
- For documentation, visit [MS Learn](https://learn.microsoft.com/agent-framework/)

## 🙏 Acknowledgments

This TypeScript SDK is based on the .NET implementation and follows similar architectural patterns while being idiomatic to the TypeScript/JavaScript ecosystem.
