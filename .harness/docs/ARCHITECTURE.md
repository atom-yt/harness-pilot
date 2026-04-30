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
