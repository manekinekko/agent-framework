# TypeScript SDK Samples

This directory contains samples demonstrating how to use the Microsoft Agent Framework TypeScript SDK.

## Prerequisites

- Node.js 18 or higher
- npm, yarn, or pnpm
- An OpenAI API key or Azure OpenAI deployment

## Setup

1. Install dependencies:

```bash
npm install
# or
yarn install
# or
pnpm install
```

2. Set up environment variables:

```bash
# For OpenAI
export OPENAI_API_KEY="your-api-key"

# For Azure OpenAI
export AZURE_OPENAI_ENDPOINT="https://your-resource.openai.azure.com"
export AZURE_OPENAI_DEPLOYMENT_NAME="your-deployment-name"
```

Or create a `.env` file:

```env
OPENAI_API_KEY=your-api-key
AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com
AZURE_OPENAI_DEPLOYMENT_NAME=your-deployment-name
```

## Running Samples

### Using ts-node

```bash
npx ts-node getting-started/01-basic-agent.ts
npx ts-node getting-started/02-multiturn-conversation.ts
npx ts-node getting-started/03-function-tools.ts
npx ts-node getting-started/04-azure-openai.ts
npx ts-node getting-started/05-middleware.ts
```

### Using tsx (faster)

```bash
npx tsx getting-started/01-basic-agent.ts
npx tsx getting-started/02-multiturn-conversation.ts
npx tsx getting-started/03-function-tools.ts
npx tsx getting-started/04-azure-openai.ts
npx tsx getting-started/05-middleware.ts
```

## Sample Descriptions

### 01-basic-agent.ts

Demonstrates the most basic usage of the OpenAI chat agent with both non-streaming and streaming responses.

**Topics covered:**
- Creating a chat client
- Creating an agent
- Running non-streaming requests
- Running streaming requests

### 02-multiturn-conversation.ts

Shows how to use threads to maintain conversation state across multiple turns.

**Topics covered:**
- Creating and using threads
- Multi-turn conversations
- Context preservation

### 03-function-tools.ts

Demonstrates how to extend agent capabilities with custom functions/tools.

**Topics covered:**
- Defining functions
- Function schema definition
- Function invocation
- Multiple function calls

### 04-azure-openai.ts

Shows how to use Azure OpenAI with Azure AD authentication.

**Topics covered:**
- Azure OpenAI client
- Azure AD authentication
- Using Azure credentials

### 05-middleware.ts

Demonstrates how to use middleware for cross-cutting concerns.

**Topics covered:**
- Built-in middleware (logging, retry)
- Custom middleware
- Middleware composition
- Request/response modification

## Additional Resources

- [TypeScript SDK Documentation](../packages/core/README.md)
- [API Reference](../packages/core/README.md#api-reference)
- [Main Documentation](https://learn.microsoft.com/agent-framework/)

## Troubleshooting

### "Cannot find module '@microsoft/agent-framework'"

Make sure you've installed the package:

```bash
cd ../packages/core
npm install
npm run build
npm link

cd ../../samples
npm link @microsoft/agent-framework
```

### Authentication errors with Azure OpenAI

Make sure you're authenticated with Azure:

```bash
az login
```

Or use an API key instead of credentials:

```typescript
const client = new AzureOpenAIChatClient({
  endpoint: process.env.AZURE_OPENAI_ENDPOINT!,
  deploymentName: process.env.AZURE_OPENAI_DEPLOYMENT_NAME!,
  apiKey: process.env.AZURE_OPENAI_API_KEY,
});
```

## Support

For issues or questions, please file a [GitHub issue](https://github.com/microsoft/agent-framework/issues).
