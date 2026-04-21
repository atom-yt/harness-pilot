---
paths:
  - "**/*"
---
# Common Development Rules

> This file contains rules that apply across all languages and technologies in this project.

## Safety Rules

### 🚫 Never Delete Data

**Strictly prohibited:**
- `DROP TABLE`, `DROP DATABASE`, `DELETE FROM` without explicit WHERE clause
- Deletion of files, directories, or repositories without confirmation
- Force-pushing or destructive git operations

**Before any destructive operation:**
1. Ask for explicit user confirmation
2. State exactly what will be deleted
3. Offer a dry-run or preview option

### 🔒 Security Hard Rules

**Never expose:**
- API keys, secrets, passwords, tokens in code or comments
- Hardcoded credentials in any form

**Never modify:**
- Security configurations without explicit instruction
- Authentication/authorization logic without explanation

## Code Quality

### Testing Requirements

- When adding new functionality: add tests
- When fixing bugs: add tests that reproduce the bug
- When refactoring: ensure existing tests still pass

### Commit Discipline

- Use conventional commit messages: `feat:`, `fix:`, `refactor:`, `docs:`, etc.
- One logical change per commit
- Commit only working code (not "save points")

## Project-Specific Rules

> Add your project-specific rules below

### [Custom Rule 1]

> Description of when this rule applies and what the expected behavior is.

### [Custom Rule 2]

> Description of when this rule applies and what the expected behavior is.