# Zod 4.x Compatibility with Mastra

⸻

**Last Updated**: December 4, 2025

## Investigation Results

### Mastra Support for Zod 4

✅ **Mastra DOES support Zod 4.x**

Verified via npm registry:
```bash
npm view @mastra/core peerDependencies
# Result: { zod: '^3.25.0 || ^4.0.0' }
```

Mastra explicitly supports both Zod 3.x and Zod 4.x.

### AI SDK Support for Zod 4

✅ **Vercel AI SDK supports Zod 4.x**

Verified via npm registry:
```bash
npm view ai peerDependencies
# Result: { zod: '^3.25.76 || ^4.1.8' }
```

The AI SDK requires Zod `^4.1.8` minimum for Zod 4.x support.

### Current Configuration

- **Our Zod version**: `4.1.13` (latest stable)
- **Mastra requirement**: `^3.25.0 || ^4.0.0` ✅ **MET**
- **AI SDK requirement**: `^3.25.76 || ^4.1.8` ✅ **MET**

## Peer Dependency Warnings Explained

During `pnpm install`, you may see warnings like:
```
✕ unmet peer zod@^3.23.8: found 4.1.13
```

### Why These Warnings Appear

1. **Nested Dependencies**: Some transitive dependencies (like older versions of `@ai-sdk/*` packages) still declare `zod@^3.23.8` as peer dependency
2. **Backward Compatibility**: These warnings are informational - Mastra and AI SDK themselves support Zod 4
3. **False Positives**: pnpm checks all peer dependencies in the tree, including nested ones that may not be directly used

### Are These Warnings Safe to Ignore?

**Yes, in most cases.** Here's why:

1. **Mastra Core Supports It**: `@mastra/core@0.24.6` explicitly supports Zod 4.x
2. **AI SDK Supports It**: The `ai` package supports Zod 4.x (requires `^4.1.8`)
3. **Version Compatibility**: Our `zod@4.1.13` meets all minimum requirements
4. **Runtime Compatibility**: Zod 4.x is backward compatible with Zod 3.x schemas in most cases

### When to Be Concerned

⚠️ **Watch for these issues**:
- Runtime errors when Mastra validates schemas
- Type mismatches in TypeScript compilation
- Schema validation failures in tests

If you encounter these, consider:
1. Testing with Zod 3.x first to isolate the issue
2. Checking if specific Mastra features require Zod 3.x
3. Reporting to Mastra if it's a compatibility bug

## Mastra's Zod v4 Development History

Evidence of active Zod v4 support:
- Pre-release versions with Zod v4 compatibility work:
  - `0.0.0-zod-v4-compat-part-2-20250820135355`
  - `0.0.0-zod-v4-compat-part-2-20250822105954`
  - `0.0.0-zod-v4-stuff-20250825154219`
- Current stable version (`0.24.6`) includes Zod v4 support

## Recommendation

✅ **Keep Zod 4.1.13**

**Rationale**:
1. Mastra officially supports Zod 4.x
2. AI SDK supports Zod 4.x (with `^4.1.8` minimum)
3. Our version (4.1.13) meets all requirements
4. Zod 4.x provides better performance and new features
5. Peer dependency warnings are from nested dependencies, not core packages

## Testing Checklist

After installation, verify:
- [ ] Mastra agents initialize without errors
- [ ] Schema validation works in Mastra workflows
- [ ] AI SDK tool calls work correctly
- [ ] Type inference works in TypeScript
- [ ] No runtime validation errors

## Fallback Plan

If issues arise, you can temporarily downgrade to Zod 3.x:

```json
{
  "dependencies": {
    "zod": "^3.23.8"
  }
}
```

Then run `pnpm install` and test again.

⸻

**Conclusion**: Zod 4.1.13 is compatible with Mastra. Peer dependency warnings are informational and can be safely ignored unless runtime issues occur.

