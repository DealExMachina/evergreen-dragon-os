# First Push Instructions

## Repository Setup

1. **Create the repository on GitHub**
   - Organization: `DealExMachina`
   - Repository name: `evergreen-dragon-os`
   - Description: "AI-native operating system for evergreen and ELTIF 2.0 fund management"
   - Visibility: Public (or Private, as preferred)
   - Initialize with README: No (we already have one)
   - Add .gitignore: No (we already have one)
   - Choose a license: MIT (we already have LICENSE file)

2. **Configure Branch Protection** (after first push)
   - Go to Settings → Branches
   - Add rule for `main` branch
   - Follow settings in `.github/BRANCH_PROTECTION.md`

## Initial Commit and Push

```bash
# Verify all files are staged
git status

# Create initial commit
git commit -m "Initial commit: AI-native fund management OS

- Agent orchestration with Mastra
- Temporal workflows for durable operations
- Supabase operational data layer
- DuckDB analytical engine
- mem0 institutional memory
- Comprehensive test suite
- Full documentation"

# Add remote (already configured)
git remote set-url origin https://github.com/DealExMachina/evergreen-dragon-os.git

# Push to main branch
git push -u origin main
```

## Post-Push Checklist

- [ ] Verify README renders correctly on GitHub
- [ ] Verify badges work
- [ ] Verify mermaid diagrams render
- [ ] Set up branch protection rules
- [ ] Enable GitHub Actions (if using CI)
- [ ] Add repository topics: `ai`, `fund-management`, `temporal`, `mastra`, `typescript`
- [ ] Add repository description
- [ ] Pin important documentation issues (if any)

## Repository Settings

### General
- Description: "AI-native operating system for evergreen and ELTIF 2.0 fund management"
- Website: (if applicable)
- Topics: `ai`, `fund-management`, `evergreen-funds`, `eltif`, `temporal`, `mastra`, `typescript`, `nodejs`, `supabase`, `duckdb`

### Features
- ✅ Issues
- ✅ Projects
- ✅ Wiki: Optional
- ✅ Discussions: Optional

### Merge Button
- Allow squash merging: Yes
- Allow merge commits: Yes
- Allow rebase merging: Yes

