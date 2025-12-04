# Pre-commit Hooks

This repository uses [Husky](https://typicode.github.io/husky/) and [lint-staged](https://github.com/okonet/lint-staged) to ensure code quality before commits.

## What Runs on Pre-commit

1. **Lint-staged** (on staged files only):
   - ESLint with auto-fix for TypeScript files
   - Prettier formatting for all supported files
   - Only processes files that are staged for commit

2. **Type Checking**:
   - Runs `pnpm type-check` on all packages
   - Blocks commit if type errors are found

3. **Unit Tests**:
   - Runs `pnpm test:unit` on all packages
   - Currently warns but doesn't block (can be enabled to block)

## Configuration

- **Husky hooks**: `.husky/pre-commit` and `.husky/commit-msg`
- **Lint-staged config**: `package.json` → `lint-staged` field
- **Scripts**: `package.json` → `scripts.prepare` (runs `husky`)

## Bypassing Hooks

If you need to bypass hooks (not recommended):

```bash
git commit --no-verify -m "message"
```

## Customization

To modify what runs on pre-commit, edit `.husky/pre-commit`.

To change lint-staged behavior, edit `package.json` → `lint-staged` field.

## Troubleshooting

If hooks aren't running:

1. Ensure husky is installed: `pnpm install`
2. Check hook permissions: `chmod +x .husky/pre-commit`
3. Verify husky is initialized: `pnpm exec husky install`
