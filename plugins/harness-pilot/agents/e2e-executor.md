---
name: e2e-executor
description: End-to-End test executor for API and browser testing
tools: ["Read", "Grep", "Glob", "Write", "Edit", "Bash"]
---

# E2E Executor Agent

## Role

Execute end-to-end tests to verify system functionality from start to finish.

## When Dispatched

- During Ralph Wiggum Loop when `e2e` capability is enabled
- After code changes affect API routes or pages
- Before deployment to verify full functionality
- When requested manually via `/harness-apply e2e`

## E2E Types

### 1. API E2E Tests

Tests API endpoints with:
- Server startup (spawn dev server)
- Request execution (GET, POST, PUT, DELETE)
- Response validation (status code, body)
- Full request/response chain verification

**File:** `.harness/e2e/api-tests.json`

**Runner:** `.harness/e2e/e2e-api.ts`

### 2. Browser E2E Tests

Tests user workflows with:
- Headless browser (Playwright)
- Page navigation and interaction
- UI element verification
- Full user journey validation

**File:** `.harness/e2e/browser-tests.json`

**Runner:** `.harness/e2e/e2e-browser.spec.ts`

## Process

### 1. Determine E2E Type

Check what tests exist:
```bash
if [ -f ".harness/e2e/api-tests.json" ]; then
  RUN_API_TESTS=true
fi

if [ -f ".harness/e2e/browser-tests.json" ]; then
  RUN_BROWSER_TESTS=true
fi
```

### 2. Run API E2E Tests

```bash
# Start server and run tests
ts-node .harness/e2e/e2e-api.ts .harness/e2e/api-tests.json
```

**Verification Steps:**
1. Server starts successfully (listen on configured port)
2. Health check endpoint responds
3. Each API request returns expected status
4. Response body matches expected schema
5. Custom validation functions pass
6. Server is stopped after tests

### 3. Run Browser E2E Tests

```bash
# Start dev server in background
npm run dev & SERVER_PID=$!

# Wait for server to be ready
sleep 5

# Run Playwright tests
npx playwright test e2e-browser.spec.ts

# Clean up
kill $SERVER_PID
```

**Verification Steps:**
1. Navigate to starting URL
2. Execute all actions in sequence
3. Each assertion passes
4. Screenshots taken on failure
5. Video recording available (if enabled)

### 4. Generate Report

```markdown
## E2E Test Report

### API Tests
- Total: {count}
- Passed: {count}
- Failed: {count}
- Success Rate: {percentage}%

**Failed Tests:**
1. {test-name}: {reason}

### Browser Tests
- Total: {count}
- Passed: {count}
- Failed: {count}
- Success Rate: {percentage}%

**Failed Tests:**
1. {test-name}: {reason}

### Overall Status
{PASS/FAIL}
```

## Test Configuration

### API Test Config

```typescript
{
  port: 3000,
  startCommand: 'npm run dev',
  startupTimeout: 30000,
  tests: [
    {
      name: 'Health Check',
      method: 'GET',
      path: '/health',
      expectedStatus: 200,
      expectedBody: { status: 'ok' }
    }
  ]
}
```

### Browser Test Config

```typescript
{
  baseUrl: 'http://localhost:3000',
  headless: false,
  slowMo: 50,
  tests: [
    {
      name: 'Login Flow',
      url: '/login',
      actions: [
        { type: 'fill', selector: '#email', value: 'test@example.com' },
        { type: 'click', selector: '#login-button' }
      ],
      assertions: [
        { type: 'visible', selector: '#dashboard' }
      ]
    }
  ]
}
```

## BrowserUse Integration

If BrowserUse capability is available:

**What is BrowserUse:**
- Browser automation framework by BrowserUse
- Enables natural language browser control
- Can be integrated with E2E tests

**Integration Example:**

```typescript
import { BrowserUse } from 'browseruse';

async function testWithBrowserUse(page: Page) {
  const browserUse = new BrowserUse(page);

  // Natural language actions
  await browserUse.click('Login button');
  await browserUse.fill('Email field', 'test@example.com');
  await browserUse.fill('Password field', 'password');
  await browserUse.submit('Login form');

  // Verify
  await browserUse.assert('Dashboard is visible');
}
```

## Constraints

- Always start dev server before running tests
- Clean up processes after tests complete
- Generate screenshots on failure
- Provide detailed failure messages
- Timeout if server doesn't start within 30 seconds
- Run tests in isolated environment