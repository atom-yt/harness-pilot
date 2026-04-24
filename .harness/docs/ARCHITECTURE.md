# harness-pilot Architecture

## Layer System (Next.js)

{{LAYER_RULES}}

## Next.js Specific Rules

1. **Server Components vs Client Components**
   - Server Components (`app/*.tsx`) can only import Layers 0-3
   - Client Components can import Server Component output types

2. **Route Isolation**
   - Files in `app/` directory must not import each other
   - Use `layout.tsx` for shared components

3. **API Routes**
   - `app/api/*` files are Layer 4
   - Can import Layers 0-3
   - Cannot import other API routes

4. **Dynamic Imports**
   - Prefer static imports for Layers 0-2
   - Dynamic imports only for Layer 3-4

## Data Flow

```
┌─────────────────────────────────────────────────┐
│  User / Browser Request                        │
├─────────────────────────────────────────────────┤
│                                                 │
│  Server Component (app/page.tsx)          │
│       ↓                                         │
│  Client Components (components/*.tsx)      │
│       ↓                                         │
│  Services (services/*.ts)                 │
│       ↓                                         │
│  Utils / Lib (utils/*.ts, lib/*.ts)    │
│       ↓                                         │
│  Types (types/*.ts)                        │
└─────────────────────────────────────────────────┘
```

## Module Responsibilities

| Layer | Directory | Responsibilities |
|-------|-----------|----------------|
| Layer 0 | types/ - Type definitions, interfaces |
| Layer 1 | utils/ - Utility functions, pure logic |
| Layer 2 | lib/ - External library wrappers, shared services |
| Layer 3 | services/, components/ - Business logic, UI components |
| Layer 4 | app/, api/ - Pages, API routes, server entry |

## Violation Examples

```
❌ Invalid: Server Component importing Client Component
   // app/page.tsx (Server Component)
   import { MyClientComp } from '../components/MyClientComp'
   Fix: Move MyClientComp to server/ or use 'use client'

❌ Invalid: API route importing another API route
   // app/api/users/route.ts
   import { handler } from '../posts/route'
   Fix: Move shared logic to Layer 2 (services/)

✓ Valid: Server Component importing Service
   // app/page.tsx
   import { getUser } from '../services/user'

✓ Valid: Client Component importing Utils
   // components/MyClientComp.tsx (Client Component)
   import { formatDate } from '../utils/format'
```

## Server vs Client Component Import Rules

| Component Type | Can Import | Max Layer |
|---------------|-------------|-------------|
| Server Component | All | 3 |
| Client Component | All | 3 (except Server output types) |
| API Route | Server Components only | 3 |

## React Server Actions

Server Actions (`actions/*.ts`) follow Layer 3 rules:
- Can import Layers 0-2
- Cannot import Layer 4 (other Server Actions, API routes)

---

## harness-pilot Plugin Architecture

The harness-pilot project is a Claude Code plugin with its own internal structure.

### Plugin Directory Structure

```
plugins/harness-pilot/
├── .claude-plugin/     # Plugin metadata (plugin.json)
├── .harness/           # Harness infrastructure for plugin
├── agents/             # Agent definitions
├── hooks/              # Git hooks
├── lib/                # Shared utility modules (Layer 2)
├── schemas/            # JSON schemas
├── scripts/            # Build and utility scripts
├── skills/             # Claude Code skills
│   ├── harness-analyze/  # Analysis skill
│   └── harness-apply/    # Generation/apply skill
├── templates/          # Code generation templates
└── tests/              # Plugin tests
```

### lib/ — Shared Library Modules (Layer 2)

The `lib/` directory contains shared utility modules that can be imported by all plugin tools (skills, agents, scripts).

| Module | Purpose | Key Exports |
|--------|---------|-------------|
| `config.js` | Configuration loading | `loadConfig()`, `loadConfigs()`, `loadConfigWithDefault()` |
| `constants.js` | Centralized constants | `HARNESS_DIR`, `getManifestPath()`, `THRESHOLDS`, `RALPH_WIGGUM` |
| `detect-language.js` | Language/framework detection | `detectLanguage()`, `getExtensions()`, `detectFramework()` |
| `fs-utils.js` | File system operations | `readJSON()`, `writeJSON()`, `ensureDir()`, `fileExists()` |
| `path-utils.js` | Cross-platform paths | `getDirname()`, `normalizePath()`, `joinPath()` |

**Import Rules for lib/:**
- Skills (`skills/*/tools/*.js`) can import from `lib/` (Layer 2)
- `lib/` modules can import from each other (same layer)
- `lib/` should NOT import from skills or agents (higher layers)

**Example Usage:**
```js
// In a skill tool
import { detectLanguage } from '../lib/detect-language.js';
import { readJSON, writeJSON } from '../lib/fs-utils.js';
import { getManifestPath } from '../lib/constants.js';

const lang = detectLanguage();
const config = await readJSON('config.json', {});
```

### skills/ — Claude Code Skills (Layer 3)

Skills are the primary interaction points for Claude Code users.

| Skill | Purpose | Tools |
|-------|---------|-------|
| `harness-analyze` | Analyze project structure and health | `analyze-docs.js`, `analyze-architecture.js`, `analyze-imports.js`, `generate-report.js` |
| `harness-apply` | Generate/update harness infrastructure | `detect.js`, `select.js`, `generate.js`, `loop.js` |

**Import Rules for skills:**
- Skill tools can import from `lib/` (Layer 2)
- Skill tools should NOT import from other skills (use lib/ for shared code)
- Skills can import from `templates/` and `schemas/` (same layer)

### templates/ — Code Generation Templates (Layer 3)

Templates for generating harness infrastructure and project scaffolding.

```
templates/
├── base/               # Generic templates
├── languages/          # Language-specific templates
│   ├── typescript/
│   ├── python/
│   └── java/
├── frameworks/         # Framework-specific templates
│   ├── nextjs/
│   ├── django/
│   └── spring/
└── capabilities/       # Extended capability templates
    └── code-templates/
```

### agents/ — Agent Definitions (Layer 3)

Reusable agent configurations for specialized tasks.

```
agents/
├── code-reviewer.md
├── refactoring-agent.md
└── ...
```

### Plugin Layer Summary

| Layer | Directory | Description | Can Import |
|-------|-----------|-------------|------------|
| Layer 0 | - | External packages only | - |
| Layer 1 | - | N/A (no pure utils currently) | - |
| Layer 2 | `lib/` | Shared utility modules | Layer 0 |
| Layer 3 | `skills/`, `templates/`, `agents/` | Skills, templates, agents | Layers 0-2 |
| Layer 4 | `scripts/`, `hooks/` | Build scripts, git hooks | Layers 0-3 |
