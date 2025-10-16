# Changelog

All notable changes to the Microsoft Agent Framework TypeScript SDK will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0-beta.1] - 2025-10-16

### Added
- Initial TypeScript SDK implementation
- Core agent abstractions (`AIAgent`, `DelegatingAIAgent`)
- Thread management (`AgentThread`, `InMemoryAgentThread`)
- Message storage (`ChatMessageStore`, `InMemoryChatMessageStore`)
- OpenAI client integration (`OpenAIChatClient`, `OpenAIChatAgent`)
- Azure OpenAI client integration (`AzureOpenAIChatClient`)
- Function/tool calling support (`AIFunction`, `defineFunction`)
- Middleware system (`MiddlewareAgent`, middleware functions)
- Streaming support for real-time responses
- TypeScript type definitions and full type safety
- Comprehensive documentation and README
- Sample code demonstrating key features:
  - Basic agent usage
  - Multi-turn conversations
  - Function tools
  - Azure OpenAI integration
  - Middleware patterns
- Unit tests with Vitest
- Build configuration with tsup
- ESLint configuration for code quality

### Features Parity with .NET SDK
- ✅ Agent abstraction layer
- ✅ Thread-based conversation management
- ✅ In-memory and custom message storage
- ✅ OpenAI and Azure OpenAI support
- ✅ Function/tool calling
- ✅ Streaming responses
- ✅ Middleware pipeline
- 🚧 OpenTelemetry integration (planned)
- 🚧 Workflow orchestration (planned)
- 🚧 Additional agent providers (planned)

### Technical Details
- Built with TypeScript 5.8
- ES2022 target with ESM modules
- Tree-shakeable package design
- Minimal dependencies (OpenAI SDK, Azure Identity)
- Comprehensive unit test coverage
- Node.js 18+ required

[1.0.0-beta.1]: https://github.com/microsoft/agent-framework/releases/tag/typescript-v1.0.0-beta.1
