---
name: harness-apply
description: Auto-generate complete harness infrastructure with default settings
---

# Harness Apply (Auto Mode)

**Announce at start:** "I'm using harness-apply to auto-generate harness infrastructure with default settings."

**Context:** Generates complete harness infrastructure automatically using detected language/framework defaults.

## Overview

One-click generation mode that:

1. Detects project language and framework automatically
2. Uses recommended layer mapping for detected structure
3. Uses default quality rule set
4. Creates all files: AGENTS.md, docs/, scripts/, harness/
5. Validates generated scripts are executable

Best for: Standard-structure projects, quick setup, acceptable defaults.

## Auto Detection

### Language Detection

```bash
detect_language() {
  if [ -f "tsconfig.json" ] || grep -q '"typescript"' package.json; then
    echo "TypeScript"
  elif [ -f "package.json" ]; then
    echo "JavaScript"
  elif [ -f "requirements.txt" ] || [ -f "pyproject.toml" ] || [ -f "setup.py" ]; then
    echo "Python"
  elif [ -f "go.mod" ]; then
    echo "Go"
  elif [ -f "Cargo.toml" ]; then
    echo "Rust"
  else
    echo "Unknown"
  fi
}
```

### Framework Detection

```bash
detect_framework() {
  local lang=$1
  case $lang in
    "TypeScript"|"JavaScript")
      if grep -q '"next"' package.json || [ -d "app/" ]; then
        echo "Next.js"
      elif grep -q '"react"' package.json; then
        echo "React"
      elif grep -q '"express"' package.json; then
        echo "Express"
      else
        echo "None"
      fi
      ;;
    "Python")
      if [ -f "settings.py" ] || [ -f "manage.py" ]; then
        echo "Django"
      elif grep -q "fastapi" requirements.txt pyproject.toml 2>/dev/null; then
        echo "FastAPI"
      elif grep -q "flask" requirements.txt 2>/dev/null; then
        echo "Flask"
      else
        echo "None"
      fi
      ;;
    "Go")
      if grep -q "gin" go.mod; then
        echo "Gin"
      else
        echo "None"
      fi
      ;;
    *)
      echo "None"
      ;;
  esac
}
```

### Directory Structure Detection

```bash
detect_structure() {
  local dirs=""
  for dir in types utils lib components services app api src; do
    if [ -d "$dir" ]; then
      dirs="$dirs $dir/"
    fi
  done
  echo "$dirs"
}
```

## Auto Configuration

### Default Layer Mappings

| Framework | Layer Mapping |
|---------|---------------|
| **Next.js** | 0:types/, 1:utils/, 2:lib/, 3:components/,services/, 4:app/,api/ |
| **React** | 0:types/, 1:utils/, 2:hooks/,contexts/, 3:components/,services/, 4:pages/,app/ |
| **Express.js** | 0:types/, 1:utils/, 2:services/, 3:routes/, 4:server.js |
| **Django** | 0:types/,models.py, 1:utils/,helpers/, 2:services/,managers/, 3:views/,api/, 4:urls.py,admin.py |
| **FastAPI** | 0:types/,models/, 1:utils/, 2:services/,managers/, 3:api/, 4:main.py |
| **Gin** | 0:types/, 1:utils/, 2:services/, 3:handlers/, 4:main.go |

### Default Quality Rules

Always enabled by default:

```javascript
{
  "no_console_log": true,
  "max_file_size": 500,
  "typescript_strict_mode": true,
  "no_hardcoded_strings": false
}
```

### Default Validation Pipeline

| Language | Build | Test | Lint | Lint-Arch | Validate |
|---------|-------|-------|-------|-----------|----------|
| TypeScript | `npm run build` | `npm test` | `npm run lint` | `ts-node scripts/lint-deps.ts` | `ts-node scripts/validate.ts` |
| JavaScript | `npm run build` | `npm test` | `npm run lint` | `node scripts/lint-deps.js` | `node scripts/validate.js` |
| Python | `pip install -e .` | `pytest` | `ruff check .` | `python scripts/lint-deps.py` | `python scripts/validate.py` |
| Go | `go build ./...` | `go test ./...` | `golangci-lint run` | `go run scripts/lint-deps.go` | `go run scripts/validate.go` |

## Generation Steps

### Step 1: Create Directory Structure

```bash
mkdir -p docs docs/design-docs docs/exec-plans
mkdir -p scripts/verify
mkdir -p harness/memory/{episodic,procedural,failures}
mkdir -p harness/tasks
mkdir -p harness/trace/failures
```

### Step 2: Generate AGENTS.md

Use template based on detected language/framework.

**Template** (~100 lines):

```markdown
# [PROJECT_NAME] Agent Guide

## Quick Links
- [Architecture Overview](docs/ARCHITECTURE.md) — Layer rules, data flow
- [Development Guide](docs/DEVELOPMENT.md) — Build, test, lint commands

## Build Commands
{{#if LANGUAGE eq 'TypeScript'}}
npm run build      # Build project
npm test           # Run tests
npm run lint-arch  # Run architecture lint
{{/if}}
{{#if LANGUAGE eq 'Python'}}
pip install -e .  # Build project
pytest              # Run tests
python scripts/lint-deps.py  # Run architecture lint
{{/if}}
{{#if LANGUAGE eq 'Go'}}
go build ./...     # Build project
go test ./...       # Run tests
go run scripts/lint-deps.go  # Run architecture lint
{{/if}}

## Layer Rules
{{LAYER_MAPPING}}

## Quality Standards
{{#if no_console_log}}
- Structured logging, no console.log / print()
{{/if}}
{{#if max_file_size}}
- Single file not to exceed {{max_file_size}} lines
{{/if}}
{{#if typescript_strict_mode}}
- TypeScript strict mode enabled
{{/if}}
```

### Step 3: Generate docs/ARCHITECTURE.md

**Template**:

```markdown
# [PROJECT_NAME] Architecture

## Layer System

{{LAYER_RULES}}

## Dependency Rules

- Higher layers may import lower layers
- Lower layers CANNOT import higher layers
- Layers at same level may import each other

## Data Flow

1. User interaction → Layer 4 (api/, app/)
2. Layer 4 → Layer 3 (services/, components/)
3. Layer 3 → Layer 2 (lib/, utils/)
4. Layer 2 → Layer 1 (utils/)
5. Layer 1 → Layer 0 (types/)

## Module Responsibilities

| Layer | Responsibilities |
|-------|----------------|
| Layer 0 | Type definitions, interfaces, no internal dependencies |
| Layer 1 | Utility functions, pure logic |
| Layer 2 | External library wrappers, shared services |
| Layer 3 | Business logic, domain services |
| Layer 4 | HTTP handlers, UI components, routing |
```

### Step 4: Generate docs/DEVELOPMENT.md

**Template**:

```markdown
# [PROJECT_NAME] Development Guide

## Prerequisites

- Node.js 18+ (for TypeScript/JavaScript)
- Python 3.11+ (for Python)
- Go 1.21+ (for Go)

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
# Run all tests
{{TEST_CMD}}

# Run with coverage
{{TEST_COVERAGE_CMD}}

# Run specific file
{{TEST_CMD}} path/to/test.test.ts
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Build fails | Check Node/Python/Go version matches requirements |
| Tests fail locally but pass in CI | Check environment variables and dependencies |
| Lint errors | Review ARCHITECTURE.md for layer rules |
```

### Step 5: Generate Scripts

**lint-deps.{ts,py,go}**:

Detects layer violations in imports.

```typescript
// TypeScript version
import * as fs from 'fs';
import * as path from 'path';

const LAYERS: Record<string, number> = {{LAYER_MAP}};

function analyzeImports(filePath: string): void {
  const content = fs.readFileSync(filePath, 'utf-8');
  const imports = content.match(/import\s+.*\s+from\s+['"]([^'"]+)['"]/g) || [];

  imports.forEach(imp => {
    const module = imp[1];
    const currentLayer = getLayerOfFile(filePath);
    const targetLayer = getLayerOfModule(module);

    if (currentLayer > targetLayer) {
      console.error(`✗ Layer violation in ${filePath}`);
      console.error(`  Layer ${currentLayer} cannot import Layer ${targetLayer}`);
      console.error(`  Fix: Move import to a lower layer or use interface`);
      process.exit(1);
    }
  });
}
```

**lint-quality.{ts,py,go}**:

Enforces code quality rules.

```typescript
// TypeScript version
import * as ts from 'typescript';

const RULES = {
  noConsoleLog: {{no_console_log}},
  maxFileSize: {{max_file_size}},
  strictMode: {{typescript_strict_mode}}
};

function checkFile(filePath: string): void {
  const source = fs.readFileSync(filePath, 'utf-8');
  const lines = source.split('\n');

  if (lines.length > RULES.maxFileSize) {
    console.error(`✗ File too large: ${filePath} (${lines.length} lines)`);
    console.error(`  Max: ${RULES.maxFileSize} lines`);
    process.exit(1);
  }

  if (RULES.noConsoleLog && /console\.log/.test(source)) {
    console.error(`✗ Console.log found in ${filePath}`);
    console.error(`  Use logger instead`);
    process.exit(1);
  }
}
```

**validate.{ts,py,go}**:

Unified validation pipeline.

```typescript
// TypeScript version
import { spawn } from 'child_process';

const VALIDATION_ORDER = [
  { name: 'build', cmd: '{{BUILD_CMD}}' },
  { name: 'lint-arch', cmd: '{{LINT_ARCH_CMD}}' },
  { name: 'test', cmd: '{{TEST_CMD}}' },
  { name: 'verify', cmd: '{{VALIDATE_CMD}}' }
];

async function runValidation(): Promise<void> {
  for (const step of VALIDATION_ORDER) {
    console.log(`\n🔧 Running ${step.name}...`);
    const result = await spawn(step.cmd, { shell: true });

    if (result.status !== 0) {
      console.error(`✗ ${step.name} failed`);
      process.exit(1);
    }
    console.log(`✓ ${step.name} passed (${result.duration}s)`);
  }
}

runValidation();
```

### Step 6: Generate harness/ Structure

```
harness/
├── memory/
│   ├── episodic/          # Placeholders for event memories
│   ├── procedural/         # Placeholders for process memories
│   └── failures/          # Empty for Critic analysis
├── tasks/               # Empty for task tracking
└── trace/               # Empty for execution traces
```

### Step 7: Set Executable Permissions

```bash
# Make scripts executable
chmod +x scripts/lint-deps.*
chmod +x scripts/lint-quality.*
chmod +x scripts/validate.*
chmod +x scripts/verify/*
```

### Step 8: Output Success

```bash
✓ Harness infrastructure generated!

Configuration:
  - Language: {{LANGUAGE}}
  - Framework: {{FRAMEWORK}}
  - Template: templates/{{LANGUAGE}}/{{FRAMEWORK}}/
  - Layers: Auto-detected
  - Quality rules: Default set

Files created:
  ✓ AGENTS.md
  ✓ docs/ARCHITECTURE.md
  ✓ docs/DEVELOPMENT.md
  ✓ scripts/lint-deps.{{EXT}} (executable)
  ✓ scripts/lint-quality.{{EXT}} (executable)
  ✓ scripts/validate.{{EXT}} (executable)
  ✓ harness/memory/, tasks/, trace/

Total: 8 files, 4 directories

Next steps:
  1. Review AGENTS.md to understand the structure
  2. Run `{{BUILD_CMD}}` to verify build works
  3. Run `{{LINT_ARCH_CMD}}` to check existing code
  4. Run `{{VALIDATE_CMD}}` to test validation pipeline

Would you like to:
  [ ] Run lint now to see existing issues
  [ ] Open AGENTS.md for review
  [ ] Create a test file to verify harness works
```

## Error Handling

| Error | Action |
|-------|--------|
| Language not detected | Fall back to base templates, ask user for language |
| Framework not detected | Use language-only templates |
| File already exists | Ask to overwrite or skip |
| Template missing | Generate minimal file and inform user |

## After Generation

Offer follow-up options:

1. **Run harness-analyze** - Verify health of generated harness
2. **Begin development** - Start using harness for tasks
3. **harness-guide** - Regenerate with different settings
