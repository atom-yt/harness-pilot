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