# harness-pilot Development Guide

## Prerequisites

{{#if LANGUAGE eq 'TypeScript'|'JavaScript'}}
- Node.js 18+
- npm or yarn
{{/if}}
{{#if LANGUAGE eq 'Python'}}
- Python 3.11+
- pip
- virtual environment recommended
{{/if}}
{{#if LANGUAGE eq 'Go'}}
- Go 1.21+
- go mod
{{/if}}

## Setup

```bash
{{#if LANGUAGE eq 'TypeScript'|'JavaScript'}}
npm install
{{/if}}
{{#if LANGUAGE eq 'Python'}}
python -m venv venv
source venv/bin/activate
pip install -e .
{{/if}}
{{#if LANGUAGE eq 'Go'}}
go mod download
go build ./...
{{/if}}
```

## Commands

| Command | Description |
|---------|-------------|
| `{{BUILD_CMD}}` | Build the project |
| `{{TEST_CMD}}` | Run tests |
| `{{LINT_CMD}}` | Run linter |
| `{{LINT_ARCH_CMD}}` | Run architecture lint |
| `{{VALIDATE_CMD}}` | Run full validation pipeline |

## Testing

```bash
{{#if LANGUAGE eq 'TypeScript'|'JavaScript'}}
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run specific file
npm test -- path/to/test.test.ts
{{/if}}
{{#if LANGUAGE eq 'Python'}}
# Run all tests
pytest

# Run with coverage
pytest --cov=src --cov-report=html

# Run specific file
pytest path/to/test.py
{{/if}}
{{#if LANGUAGE eq 'Go'}}
# Run all tests
go test ./...

# Run with coverage
go test ./... -coverprofile=coverage.out -covermode=atomic

# Run specific file
go test ./path/to/package -run TestName
{{/if}}
```

## Validation Pipeline

The validation pipeline runs in this order:

```
build → lint-arch → test → verify
  │        │         │       │
  │        │         │       └─ End-to-end functional verification
  │        │         └─ Unit/integration tests
  │        └─ Architecture and quality compliance
  └─ Code can compile
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Build fails | Check version matches requirements |
| Tests fail locally but pass in CI | Check environment variables |
| Lint errors | Review .harness/docs/ARCHITECTURE.md for layer rules |
| Verification timeout | Check verify scripts are executable |
