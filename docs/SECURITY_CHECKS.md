# Security Checks

This repository includes multiple layers of security checks to catch vulnerabilities early.

## Pre-commit Security Checks

### 1. Dependency Vulnerability Scanning

- Runs `pnpm audit --audit-level=moderate` before each commit
- Checks for known vulnerabilities in dependencies
- Currently warns but doesn't block (can be enabled to block)

### 2. ESLint Security Rules

The following security-focused ESLint plugins are configured:

#### `eslint-plugin-security`

- Detects potential security vulnerabilities in code
- Rules include:
  - `detect-eval-with-expression`: Blocks use of `eval()` with dynamic expressions
  - `detect-unsafe-regex`: Detects ReDoS vulnerabilities
  - `detect-object-injection`: Warns about object injection attacks
  - `detect-non-literal-fs-filename`: Warns about unsafe file system operations
  - `detect-child-process`: Warns about unsafe child process execution
  - And more...

#### `eslint-plugin-sonarjs`

- Code quality and bug detection
- Helps identify:
  - Cognitive complexity issues
  - Duplicate code
  - Redundant logic
  - Potential bugs

## Manual Security Checks

### Run Dependency Audit

```bash
pnpm security:audit
# or
pnpm audit --audit-level=moderate
```

### Run Full Security Check

```bash
pnpm security:check
```

This runs both dependency audit and security-focused linting.

### Fix Automatically Fixable Issues

```bash
pnpm audit fix
```

## CI/CD Security

The GitHub Actions workflow (`.github/workflows/ci.yml`) runs:

- Type checking
- Linting (including security rules)
- Tests

## Making Security Checks Blocking

To make security checks block commits, edit `.husky/pre-commit`:

```bash
# In the security audit section, uncomment:
exit 1
```

## Security Best Practices

1. **Never commit secrets**: Use environment variables or Infisical
2. **Keep dependencies updated**: Run `pnpm audit` regularly
3. **Review security warnings**: Don't ignore ESLint security warnings
4. **Use type safety**: Leverage TypeScript strict mode
5. **Validate inputs**: Use Zod schemas for runtime validation
6. **Handle errors safely**: Use `withErrorHandling` utility

## Reporting Security Issues

If you discover a security vulnerability, please:

1. **Do not** open a public issue
2. Contact the maintainers directly
3. We will respond promptly and coordinate disclosure

## Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)
- [TypeScript Security](https://www.typescriptlang.org/docs/handbook/declaration-files/do-s-and-don-ts.html)
