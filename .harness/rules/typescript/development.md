---
paths:
  - "**/*.ts"
  - "**/*.tsx"
  - "**/*.js"
  - "**/*.jsx"
---
# TypeScript & JavaScript Development Rules

> These rules apply to all TypeScript and JavaScript files in this project.
> This file extends [common/safety.md](../common/safety.md) and [common/git-workflow.md](../common/git-workflow.md).

## Code Style

### Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Classes | PascalCase | `class UserService {}` |
| Interfaces | PascalCase | `interface User {}` |
| Types | PascalCase | `type UserId = string` |
| Functions/Methods | camelCase | `function getUserById()` |
| Variables | camelCase | `const userId` |
| Constants | UPPER_SNAKE_CASE | `const MAX_RETRIES = 3` |
| Files | kebab-case | `user-service.ts` |
| Components | PascalCase | `UserProfile.tsx` |

### Type Safety

**Always use TypeScript types:**
- Explicitly type function parameters
- Use interfaces/types for data structures
- Avoid `any` - use `unknown` when type is truly unknown
- Use proper generic types

```typescript
// Good
function processUser(user: User): ProcessedUser {
  // ...
}

// Bad
function processUser(user: any): any {
  // ...
}
```

### Async/Await

- Use `async/await` over `.then()` and `.catch()`
- Always handle errors in async functions
- Don't use `Promise` constructor when `async/await` suffices

```typescript
// Good
async function fetchData(): Promise<Data> {
  try {
    const response = await fetch(url);
    return await response.json();
  } catch (error) {
    // handle error
    throw error;
  }
}

// Bad
function fetchData() {
  return fetch(url).then(r => r.json());
}
```

## Import Organization

### Import Order

1. External libraries
2. Internal modules
3. Relative imports
4. Type-only imports

```typescript
// External libraries
import { useState } from 'react';
import { z } from 'zod';

// Internal modules
import { userService } from '@/services/user';

// Relative imports
import { Button } from './Button';

// Type-only imports
import type { User } from '@/types/user';
```

### Named vs Default Exports

**Prefer named exports:**
```typescript
// Good
export function foo() {}
export const bar = 1;
export type Baz = string;

// Usage
import { foo, bar, type Baz } from './module';
```

**Default exports only for:**
- Single-purpose components
- React pages/route handlers

## Framework-Specific Rules

{{#if FRAMEWORK eq 'Next.js'}}

### Next.js Specific

- Server Components (app/*.tsx) cannot use client-side hooks (`useState`, `useEffect`)
- Mark client components with `'use client'` at the top
- Don't use `import { Something } from 'next/dynamic'` - use `dynamic()` function
- Image assets: Use `next/image` component, not `<img>` tag

### API Routes

- Use `async` function exports
- Return `Response` or `NextResponse` objects
- Always set proper status codes and content types

{{/if}}

{{#if FRAMEWORK eq 'React'}}

### React Specific

- Always define `PropTypes` or TypeScript types for component props
- Use functional components, not class components
- Keep components pure (no side effects in render)
- Use hooks, not HOCs or render props

{{/if}}

## Testing

### Test File Naming

- Test files end with `.test.ts` or `.spec.ts`
- Test files colocated with source files: `UserService.ts` → `UserService.test.ts`

### Test Structure

```typescript
describe('UserService', () => {
  describe('getUserById', () => {
    it('returns user when found', async () => {
      // arrange
      // act
      // assert
    });

    it('throws when user not found', async () => {
      // ...
    });
  });
});
```

## Security

### User Input

- Always validate user input with schemas (Zod, Yup, etc.)
- Sanitize data before using in queries/commands
- Never trust client-side validation alone

### Secrets Management

- Use environment variables for secrets
- Never commit `.env` files (add to `.gitignore`)
- Use `.env.example` for template

## Performance

### Avoid Unnecessary Re-renders

- Memoize expensive computations with `useMemo`
- Memoize callback functions with `useCallback`
- Use `React.memo` for components that only depend on props

### Lazy Loading

- Use dynamic imports for heavy modules
- Use `React.lazy()` for code splitting
- Use `next/dynamic` for Next.js components

## Common Anti-Patterns to Avoid

### ❌ Don't Use `var`
```typescript
var name = 'John';  // Bad
let name = 'John';   // OK
const NAME = 'John'; // Best for constants
```

### ❌ Don't Ignore Promise Errors
```typescript
fetch(url);  // Bad - unhandled rejection

fetch(url).catch(console.error);  // OK - at least log it

const result = await fetch(url);  // Best - handle or bubble up
```

### ❌ Don't Use `any`
```typescript
const data: any = response.json();  // Bad

const data: unknown = response.json();  // OK
const user = z.object({...}).parse(data);  // Best - validate
```

### ❌ Don't Mix Types
```typescript
// Bad - mixing concerns in one file
interface User { ... }
function getUser() { ... }
const API_URL = '...';

// Good - separate files
// types/user.ts
// services/user.ts
// config/api.ts
```