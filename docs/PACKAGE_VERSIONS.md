# Package Versions Verification (December 2025)

⸻

**Last Updated**: December 4, 2025

All package versions have been verified against npm registry to ensure they exist and are the latest stable releases.

## Major Updates

### Breaking Changes to Note

1. **Zod**: Updated from `^3.22.4` → `^4.1.13` (major version)
   - Review Zod 4.x migration guide if using advanced features
   - Location: `packages/config/package.json`

2. **Prisma**: Updated from `^6.0.0` → `^7.1.0` (major version)
   - Review Prisma 7.x migration guide
   - Location: `packages/supabase-client/package.json`

3. **Next.js**: Updated from `^15.1.0` → `^16.0.7` (major version)
   - Review Next.js 16.x migration guide
   - Location: `apps/ag-ui/package.json`

4. **Tailwind CSS**: Updated from `^3.4.0` → `^4.1.17` (major version)
   - Review Tailwind CSS 4.x migration guide
   - Location: `apps/ag-ui/package.json`

5. **Vitest**: Updated from `^2.0.0` → `^4.0.15` (major version)
   - Review Vitest 4.x migration guide
   - Location: Multiple packages

## Verified Package Versions

### Core Dependencies

| Package | Previous | Current | Status |
|---------|----------|---------|--------|
| `@types/node` | ^22.0.0 | ^24.10.1 | ✅ Verified |
| `typescript` | ^5.7.0 | ^5.9.3 | ✅ Verified |
| `prettier` | ^3.4.0 | ^3.7.4 | ✅ Verified |
| `eslint` | ^9.0.0 | ^9.39.1 | ✅ Verified |

### Framework & Runtime

| Package | Previous | Current | Status |
|---------|----------|---------|--------|
| `next` | ^15.1.0 | ^16.0.7 | ✅ Verified (major) |
| `react` | ^19.0.0 | ^19.2.1 | ✅ Verified |
| `react-dom` | ^19.0.0 | ^19.2.1 | ✅ Verified |
| `@types/react` | ^19.0.0 | ^19.2.7 | ✅ Verified |
| `@types/react-dom` | ^19.0.0 | ^19.2.3 | ✅ Verified |

### Agent Framework

| Package | Previous | Current | Status |
|---------|----------|---------|--------|
| `@mastra/core` | ^0.24.0 | ^0.24.6 | ✅ Verified |
| `@mastra/react` | ^0.24.0 | ^0.0.21 | ✅ Verified |
| `@mastra/rag` | ^0.24.0 | ^1.3.6 | ✅ Verified |
| `@mastra/mcp` | ^0.24.0 | ^0.14.4 | ✅ Verified |

### Database & Storage

| Package | Previous | Current | Status |
|---------|----------|---------|--------|
| `@prisma/client` | ^6.0.0 | ^7.1.0 | ✅ Verified (major) |
| `prisma` | ^6.0.0 | ^7.1.0 | ✅ Verified (major) |
| `@supabase/supabase-js` | ^2.45.0 | ^2.86.0 | ✅ Verified |
| `duckdb` | ^1.1.0 | ^1.4.2 | ✅ Verified |
| `@aws-sdk/client-s3` | ^3.700.0 | ^3.943.0 | ✅ Verified |

### Workflows

| Package | Previous | Current | Status |
|---------|----------|---------|--------|
| `@temporalio/worker` | ^1.11.0 | ^1.13.2 | ✅ Verified |
| `@temporalio/client` | ^1.11.0 | ^1.13.2 | ✅ Verified |
| `@temporalio/workflow` | ^1.11.0 | ^1.13.2 | ✅ Verified |

### UI & Styling

| Package | Previous | Current | Status |
|---------|----------|---------|--------|
| `tailwindcss` | ^3.4.0 | ^4.1.17 | ✅ Verified (major) |
| `postcss` | ^8.4.0 | ^8.5.6 | ✅ Verified |
| `autoprefixer` | ^10.4.0 | ^10.4.22 | ✅ Verified |
| `eslint-config-next` | ^15.1.0 | ^16.0.7 | ✅ Verified |

### Testing

| Package | Previous | Current | Status |
|---------|----------|---------|--------|
| `vitest` | ^2.0.0 | ^4.0.15 | ✅ Verified (major) |
| `@vitest/coverage-v8` | ^2.0.0 | ^4.0.15 | ✅ Verified (major) |

### Development Tools

| Package | Previous | Current | Status |
|---------|----------|---------|--------|
| `tsx` | ^4.7.0 | ^4.21.0 | ✅ Verified |
| `zod` | ^3.22.4 | ^4.1.13 | ✅ Verified (major) |

### CopilotKit

| Package | Previous | Current | Status |
|---------|----------|---------|--------|
| `@copilotkit/react-core` | ^0.50.0 | ^1.10.6 | ✅ Verified |
| `@copilotkit/react-ui` | ^0.50.0 | ^1.10.6 | ✅ Verified |
| `@copilotkit/runtime` | ^0.50.0 | ^1.10.6 | ✅ Verified |

### Peer Dependencies

| Package | Previous | Current | Status |
|---------|----------|---------|--------|
| `langfuse` | ^3.0.0 | ^3.38.6 | ✅ Verified |
| `@infisical/sdk` | ^1.0.0 | ^4.0.6 | ✅ Verified (major) |

## Verification Method

All versions were verified using:
```bash
npm view <package-name> version
```

This ensures:
- ✅ Package exists on npm registry
- ✅ Version is published and available
- ✅ Latest stable version is used

## Security Considerations

After installing, run:
```bash
pnpm audit
```

To check for known security vulnerabilities. All packages are from official npm registry and verified sources.

## Migration Notes

### Zod 4.x
- Check for breaking changes in validation schemas
- Review migration guide: https://zod.dev/

### Prisma 7.x
- Review migration guide: https://www.prisma.io/docs/guides/upgrade-guides
- May require schema updates

### Next.js 16.x
- Review migration guide: https://nextjs.org/docs/app/building-your-application/upgrading
- Check for React 19 compatibility

### Tailwind CSS 4.x
- Major rewrite - review migration guide
- Configuration format may have changed

### Vitest 4.x
- Review breaking changes in test configuration
- Update test utilities if needed

⸻

**Next Steps**: Run `pnpm install` to install all verified packages.

