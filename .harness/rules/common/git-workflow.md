---
paths:
  - "**/*"
---
# Common Git Workflow

> This file contains git and version control rules that apply across the project.

## Commit Messages

### Format

Use conventional commits:

```
<type>(<scope>): <description>

<body>

<footer>
```

**Types:** `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `chore`

**Examples:**
```
feat(auth): add user registration endpoint
fix(api): handle null response from external service
docs(readme): update installation instructions
refactor(utils): simplify date formatting logic
```

### Before Committing

1. Review your changes with `git diff`
2. Ensure all tests pass
3. Check for accidental inclusions (secrets, temp files, debug code)

### Plugin Release Checklist

Before pushing changes that affect plugin functionality:

1. **Version Synchronization**
   - Update `plugins/harness-pilot/.claude-plugin/plugin.json`
   - Update `.claude-plugin/marketplace.json`
   - Update `plugins/harness-pilot/skills/harness-apply/tools/generate.js` (manifest template)

2. **Verify Version Match**
   ```bash
   grep -h '"version"' \n     plugins/harness-pilot/.claude-plugin/plugin.json \n     .claude-plugin/marketplace.json \n     | sort | uniq
   ```
   Should output exactly one version line.

3. **Semantic Versioning**
   - `0.x.y → 0.x.(y+1)` for bug fixes
   - `0.x.y → 0.(x+1).0` for new features
   - `0.x.y → 1.0.0` for breaking changes

**Why?** Users install plugins via marketplace.json, and version mismatch causes update failures.

## Branch Management

### Branch Naming

- `feature/` - New features
- `fix/` - Bug fixes
- `refactor/` - Code refactoring
- `docs/` - Documentation changes

### Protected Branches

- `main` - Protected, require pull requests
- `develop` - Protected, require pull requests

## Destructive Operations

### Force Push

**Never force-push to:**
- `main` branch
- `develop` branch
- Any shared/protected branch

**Force-push is only allowed on:**
- Your personal feature branches
- With explicit confirmation

### Rebase vs Merge

- **Rebase** your feature branch before creating PR
- **Merge** when merging PRs (don't rebase shared branches)

## Large Files

- Files > 50MB: Use Git LFS (Large File Storage)
- Binary assets: Commit to designated `assets/` directory, not root

## Ignore Rules

Ensure `.gitignore` covers:
- `node_modules/`, `__pycache__/`, `.DS_Store`
- IDE files: `.vscode/`, `.idea/`
- Build artifacts: `dist/`, `build/`, `*.log`
- Environment files: `.env.local`, `.env.*.local`