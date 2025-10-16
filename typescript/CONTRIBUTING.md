# Contributing to the TypeScript SDK

Thank you for your interest in contributing to the Microsoft Agent Framework TypeScript SDK!

## Development Setup

### Prerequisites

- Node.js 18 or higher
- npm 9 or higher
- Git

### Getting Started

1. Clone the repository:
```bash
git clone https://github.com/microsoft/agent-framework.git
cd agent-framework/typescript
```

2. Install dependencies:
```bash
cd packages/core
npm install
```

3. Build the package:
```bash
npm run build
```

4. Run tests:
```bash
npm test
```

## Development Workflow

### Making Changes

1. Create a new branch:
```bash
git checkout -b your-feature-name
```

2. Make your changes to the source files in `src/`

3. Add tests for your changes in `tests/`

4. Run the development build:
```bash
npm run dev  # Watches for changes and rebuilds
```

5. Run tests:
```bash
npm test
```

6. Check types:
```bash
npm run typecheck
```

7. Lint your code:
```bash
npm run lint
npm run lint:fix  # Auto-fix issues
```

### Testing

We use [Vitest](https://vitest.dev/) for testing.

- Run all tests: `npm test`
- Run tests in watch mode: `npm test -- --watch`
- Run with coverage: `npm run test:coverage`

#### Writing Tests

- Place test files in the `tests/` directory
- Name test files with `.test.ts` extension
- Follow the existing test patterns
- Aim for high code coverage

Example test:
```typescript
import { describe, it, expect } from 'vitest';
import { YourClass } from '../src/your-module.js';

describe('YourClass', () => {
  it('should do something', () => {
    const instance = new YourClass();
    expect(instance.method()).toBe('expected-result');
  });
});
```

### Code Style

- Use TypeScript for all source files
- Follow the existing code style
- Use meaningful variable and function names
- Add JSDoc comments for public APIs
- Keep functions focused and small
- Use async/await for asynchronous operations

#### TypeScript Guidelines

- Use strict type checking
- Avoid `any` types when possible
- Use interfaces for object shapes
- Use type guards for runtime checks
- Export types alongside implementations

Example:
```typescript
/**
 * Represents a user in the system.
 */
export interface User {
  id: string;
  name: string;
  email: string;
}

/**
 * Creates a new user.
 * @param data - The user data
 * @returns The created user
 */
export async function createUser(data: Omit<User, 'id'>): Promise<User> {
  const id = generateId();
  return { id, ...data };
}
```

### Adding New Features

When adding new features:

1. **Design First**: Consider the API design and how it fits with existing patterns
2. **Documentation**: Add JSDoc comments for all public APIs
3. **Tests**: Write comprehensive tests
4. **Examples**: Add usage examples to the relevant README or samples
5. **Type Safety**: Ensure full TypeScript type safety
6. **Backwards Compatibility**: Avoid breaking changes when possible

### Dependencies

- **Production Dependencies**: Only use well-maintained packages
  - Prefer packages from [@azure/*](https://github.com/Azure/azure-sdk-for-js) when available
  - Check for security vulnerabilities: `npm audit`
  - Check for outdated packages: `npm outdated`
  
- **Dev Dependencies**: Use the latest stable versions for tooling

Before adding a new dependency:
1. Check if it's really needed
2. Verify it's actively maintained
3. Check the bundle size impact
4. Run security checks

### Building

The project uses [tsup](https://tsup.egoist.dev/) for building:

```bash
npm run build        # Production build
npm run dev          # Development build with watch
npm run clean        # Clean build artifacts
```

Build outputs:
- `dist/index.js` - ESM bundle
- `dist/index.d.ts` - TypeScript declarations
- `dist/index.js.map` - Source maps

### Documentation

- Update README.md for user-facing changes
- Update JSDoc comments for API changes
- Add examples to demonstrate new features
- Update CHANGELOG.md following [Keep a Changelog](https://keepachangelog.com/)

### Commit Messages

Follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

- `feat: add streaming support for agents`
- `fix: correct type definition for ChatMessage`
- `docs: update README with new examples`
- `test: add tests for middleware`
- `refactor: simplify agent initialization`
- `chore: update dependencies`

### Pull Requests

1. Update your branch with the latest main:
```bash
git fetch origin
git rebase origin/main
```

2. Ensure all tests pass and linting is clean:
```bash
npm test
npm run lint
npm run typecheck
npm run build
```

3. Push your branch:
```bash
git push origin your-feature-name
```

4. Create a pull request on GitHub

5. Fill out the PR template with:
   - Description of changes
   - Related issues
   - Testing done
   - Breaking changes (if any)

### Release Process

Releases are handled by maintainers:

1. Update version in `package.json`
2. Update CHANGELOG.md
3. Create a git tag
4. Push to npm registry

## Project Structure

```
typescript/
├── packages/
│   └── core/              # Main package
│       ├── src/           # Source code
│       │   ├── agent.ts
│       │   ├── thread.ts
│       │   ├── types.ts
│       │   └── ...
│       ├── tests/         # Test files
│       ├── dist/          # Build output (gitignored)
│       └── package.json
└── samples/               # Example code
    └── getting-started/
```

## Getting Help

- Check existing issues and PRs
- Ask questions in GitHub Discussions
- Join our [Discord](https://discord.gg/b5zjErwbQM)

## Code of Conduct

This project follows the [Microsoft Open Source Code of Conduct](https://opensource.microsoft.com/codeofconduct/).

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
