# Contributing to Evergreen Dragon OS

We welcome contributions from the community. This document outlines the process for contributing to this project.

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/deal-ex-machina/evergreen-dragon-os.git`
3. Install dependencies: `pnpm install`
4. Create a branch: `git checkout -b feature/your-feature-name`

## Development Workflow

1. **Follow Architecture Principles**: Review `docs/ENGINEERING_PRINCIPLES.md` before making changes
2. **Write Tests**: All new code must include unit tests. Run `pnpm test` before committing
3. **Type Safety**: Ensure TypeScript compiles without errors: `pnpm type-check`
4. **Linting**: Run `pnpm lint` and fix any issues
5. **Documentation**: Update relevant documentation when adding features

## Pull Request Process

1. **Branch Protection**: The `main` branch is protected. All changes must go through pull requests
2. **Tests Must Pass**: All tests must pass before merging
3. **Code Review**: At least one maintainer must approve the PR
4. **Commit Messages**: Use clear, descriptive commit messages following conventional commits

## Code Standards

- **TypeScript**: Strict mode enabled, no `any` types without justification
- **Testing**: Use Vitest, follow patterns in `tests/TESTING_STRATEGY.md`
- **Error Handling**: Use `withErrorHandling` for all async operations
- **Logging**: Use structured logging via the shared logger
- **Dependency Injection**: Pass dependencies through context, not global singletons

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

## Questions?

Open an issue for questions or discussions about contributions.

