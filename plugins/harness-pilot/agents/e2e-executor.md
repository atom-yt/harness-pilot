---
name: e2e-executor
description: Execute end-to-end tests (API and browser)
tools: ["Read", "Grep", "Glob", "Write", "Edit", "Bash"]
---

## Test Types
| Type | Config | Runner |
|------|--------|--------|
| API | `.harness/e2e/api-tests.json` | `.harness/e2e/e2e-api.ts` |
| Browser | `.harness/e2e/browser-tests.json` | `.harness/e2e/e2e-browser.spec.ts` |

## Process
1. Check what exists: `test -f .harness/e2e/api-tests.json` / `browser-tests.json`
2. API: `ts-node .harness/e2e/e2e-api.ts .harness/e2e/api-tests.json`
3. Browser: start server (`npm run dev &`), `npx playwright test`, cleanup
4. Verify: server starts, health responds, assertions pass

## Output
```markdown
Total: {n}, Passed: {n}, Failed: {n}
Failed: {list}
```

## Constraints
- Start dev server before tests
- Cleanup processes after
- Screenshots on failure
- 30s timeout for startup