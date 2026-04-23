# Fixed: analyze-imports.js Critical Issues

## Date: 2026-04-23T16:46:01Z
## Type: code_review_findings
## Severity: critical

## Context
- Task: Ralph Wiggum Loop review phase
- File: plugins/harness-pilot/skills/harness-analyze/tools/analyze-imports.js
- Triggered by: Code review agent finding multiple critical issues

## Issues Found

### 1. Python Import Pattern Bug (CRITICAL)
- **Location:** Line 94 (original)
- **Problem:** `const module = match[1]` - only captured `from` group, not `import` group
- **Impact:** Runtime errors or incorrect statistics for Python `import` statements
- **Fix:** Changed to `const module = match[1] || match[2]`

### 2. Silent Error Handling (CRITICAL)
- **Location:** Line 107-109 (original)
- **Problem:** Empty catch block with comment "Skip files that can't be read"
- **Impact:** Impossible to debug permission, encoding, or other file access issues
- **Fix:** Added `console.error(\`Warning: Skipping ${file}: ${e.message}\`)`

### 3. Magic Number / Hardcoded Threshold (HIGH)
- **Location:** Line 115 (original)
- **Problem:** `count > 10` hardcoded with no explanation
- **Impact:** Cannot adjust threshold for different project sizes
- **Fix:** Added `DEFAULT_RELATIVE_THRESHOLD = 10` and `options.relativeThreshold` parameter

### 4. Symlink Traversal Risk (HIGH)
- **Location:** Line 73 (original)
- **Problem:** No symlink check in directory walk
- **Impact:** Could follow malicious symlinks or infinite loops
- **Fix:** Added `!entry.isSymbolicLink()` check

### 5. No File Size Limit (HIGH)
- **Location:** File reading loop (original)
- **Problem:** Read entire file into memory with no size limit
- **Impact:** Potential OOM on large files
- **Fix:** Added `MAX_FILE_SIZE = 10MB` and file size check

## Resolution
All critical and high-priority issues have been fixed:
- Python import parsing now handles both `from` and `import` patterns
- Error logging provides visibility into skipped files
- Threshold is now configurable via options parameter
- Symlink protection prevents infinite loops
- File size limit prevents OOM

## Verification
- Syntax check: PASS
- All changes backward compatible
- Function signature extended with optional `options` parameter