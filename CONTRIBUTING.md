# Contributing to buffer-cli

Thank you for your interest in contributing to buffer-cli! This document provides guidelines and information for contributors.

## Development Setup

### Prerequisites

- [Bun](https://bun.sh/) v1.0 or later
- A Buffer account for testing

### Getting Started

1. Fork and clone the repository:
   ```bash
   git clone https://github.com/YOUR_USERNAME/buffer-cli.git
   cd buffer-cli
   ```

2. Install dependencies:
   ```bash
   bun install
   ```

3. Run in development mode:
   ```bash
   bun run dev
   ```

4. Build:
   ```bash
   bun run build
   ```

5. Run tests:
   ```bash
   bun test
   ```

## Project Structure

```
buffer-cli/
├── src/
│   ├── index.ts              # CLI entry point
│   ├── commands/             # Command implementations
│   │   ├── auth.ts
│   │   ├── profiles.ts
│   │   └── post.ts
│   ├── lib/                  # Core libraries
│   │   ├── api.ts            # Buffer API client
│   │   ├── oauth.ts          # OAuth handler
│   │   ├── config.ts         # Config management
│   │   ├── templates.ts      # Template tags
│   │   └── types.ts          # TypeScript types
│   └── utils/                # Utilities
├── tests/                    # Test files
├── package.json
└── tsconfig.json
```

## Coding Standards

### TypeScript

- Use strict TypeScript (`"strict": true`)
- Prefer interfaces over type aliases for objects
- Document public functions with JSDoc comments
- Use descriptive variable names

### Code Style

- Use 2-space indentation
- Use single quotes for strings
- No semicolons (Bun style)
- Use ES modules (`import`/`export`)

### Commits

We use [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` New features
- `fix:` Bug fixes
- `docs:` Documentation changes
- `style:` Code style changes (formatting, etc.)
- `refactor:` Code refactoring
- `test:` Adding or updating tests
- `chore:` Maintenance tasks

Example:
```
feat: add Pinterest board support for post command
```

## Configuration Parity

**Important:** This CLI maintains 1:1 configuration parity with wp-to-buffer-pro. When adding or modifying configuration options:

1. Reference the original PHP plugin in `~/Projects/my-hustle-launch/web/old/wp-to-buffer-pro/`
2. Ensure key names match exactly
3. Ensure value types match exactly
4. Update `src/lib/types.ts` accordingly

## Testing

### Running Tests

```bash
# Run all tests
bun test

# Run specific test file
bun test tests/api.test.ts

# Watch mode
bun test --watch
```

### Writing Tests

- Place tests in `tests/` directory
- Name test files `*.test.ts`
- Test edge cases and error conditions
- Mock external API calls

### Testing with Real API

For integration testing with the real Buffer API:

1. Authenticate: `bun run dev auth`
2. Test commands manually
3. Use `--test-mode` in config to prevent actual posts

## Pull Request Process

1. Create a feature branch from `main`
2. Make your changes
3. Update documentation if needed
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

### PR Checklist

- [ ] Code follows project style guidelines
- [ ] Tests added/updated
- [ ] Documentation updated
- [ ] CHANGELOG.md updated
- [ ] Commit messages follow Conventional Commits
- [ ] PR description explains the changes

## Reporting Issues

When reporting issues, please include:

- buffer-cli version (`buffer-cli --version`)
- Operating system and version
- Node.js/Bun version
- Steps to reproduce
- Expected vs actual behavior
- Error messages (if any)

## Questions?

- Open a GitHub issue for bugs or feature requests
- Check existing issues before creating new ones

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
