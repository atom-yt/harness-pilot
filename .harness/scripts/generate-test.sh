#!/usr/bin/env bash
# JiT Test Generation Script
# Analyzes code changes and generates test cases

set -euo pipefail

# ============================================================================
# Configuration
# ============================================================================

COVERAGE_THRESHOLD=${COVERAGE_THRESHOLD:-80}
MAX_TESTS_PER_FUNCTION=${MAX_TESTS_PER_FUNCTION:-5}
TEST_FRAMEWORK=${TEST_FRAMEWORK:-}

# Detect test framework
detect_test_framework() {
  local lang=$1

  case $lang in
    "typescript"|"javascript")
      if grep -q '"jest"' package.json 2>/dev/null || [ -f "jest.config.js" ]; then
        echo "jest"
      elif grep -q '"vitest"' package.json 2>/dev/null || [ -f "vitest.config.ts" ]; then
        echo "vitest"
      elif grep -q '"mocha"' package.json 2>/dev/null; then
        echo "mocha"
      else
        echo "jest" # default
      fi
      ;;
    "python")
      if [ -f "pytest.ini" ] || [ -f "pyproject.toml" ] && grep -q "pytest" pyproject.toml 2>/dev/null; then
        echo "pytest"
      elif [ -f "setup.cfg" ] && grep -q "unittest" setup.cfg 2>/dev/null; then
        echo "unittest"
      else
        echo "pytest" # default
      fi
      ;;
    "go")
      echo "go-test"
      ;;
    *)
      echo "unknown"
      ;;
  esac
}

# ============================================================================
# Analysis
# ============================================================================

analyze_function_signature() {
  local file=$1

  case $file in
    *.ts|*.js)
      grep -E '(export\s+)?(async\s+)?(function|const)\s+\w+\s*\(' "$file" | \n        sed 's/^.*function \([^ ]*\).*/\1/' | \n        sed 's/^.*const \([^ ]*\).*/\1/'
      ;;
    *.py)
      grep -E '^\s*(async\s+)?def\s+\w+\s*\(' "$file" | \n        sed 's/.*def \([^ (]*\).*/\1/'
      ;;
    *.go)
      grep -E '^\s*func\s+\(.*\)\s+\w+\s*\(' "$file" | \n        sed 's/.*func .*\s\+\([^ (]*\).*/\1/'
      ;;
  esac
}

# ============================================================================
# Test Generation
# ============================================================================

generate_test_file() {
  local source_file=$1
  local language=$2
  local test_framework=$3

  local test_file
  local template

  # Determine test file location
  case $language in
    "typescript"|"javascript")
      test_file="${source_file%.*}.test.${source_file##*.}"
      template="plugins/harness-pilot/templates/capabilities/jit-test/generate-test.${language}.template"
      ;;
    "python")
      test_file="${source_file%.*}_test.py"
      template="plugins/harness-pilot/templates/capabilities/jit-test/generate-test.py.template"
      ;;
    "go")
      test_file="${source_file%.*}_test.go"
      template="plugins/harness-pilot/templates/capabilities/jit-test/generate-test.go.template"
      ;;
    *)
      echo "Unsupported language: $language"
      return 1
      ;;
  esac

  # Skip if test file already exists
  if [ -f "$test_file" ]; then
    echo "[skip] $test_file already exists"
    return 0
  fi

  # Generate test file from template
  if [ -f "$template" ]; then
    echo "[generate] Creating $test_file"
    # Use jq to safely construct JSON (prevents command injection)
    if command -v jq >/dev/null 2>&1; then
      JSON_DATA=$(jq -n --arg sf "$source_file" --arg tf "$test_framework" '{SOURCE_FILE: $sf, TEST_FRAMEWORK: $tf}')
    else
      # Fallback: escape strings properly if jq not available
      JSON_DATA=$(printf '{"SOURCE_FILE":"%s","TEST_FRAMEWORK":"%s"}' \n        "$(printf '%s' "$source_file" | sed 's/\/\/g; s/"/"/g')" \n        "$(printf '%s' "$test_framework" | sed 's/\/\/g; s/"/"/g')")
    fi
    node plugins/harness-pilot/scripts/template-engine.js "$template" "$JSON_DATA" > "$test_file"
    echo "  ✓ $test_file"
  else
    echo "[warn] Template not found: $template"
  fi
}

# ============================================================================
# Main
# ============================================================================

main() {
  echo "═══════════════════════════════════════════════════════"
  echo "          JiT Test Generator"
  echo "═══════════════════════════════════════════════════════"

  # Detect language
  if [ -f "tsconfig.json" ] || grep -q '"typescript"' package.json 2>/dev/null; then
    LANGUAGE="typescript"
  elif [ -f "requirements.txt" ] || [ -f "pyproject.toml" ]; then
    LANGUAGE="python"
  elif [ -f "go.mod" ]; then
    LANGUAGE="go"
  else
    echo "Error: Unsupported project type"
    exit 1
  fi

  echo "Language: $LANGUAGE"

  # Detect test framework
  TEST_FRAMEWORK=$(detect_test_framework "$LANGUAGE")
  echo "Test Framework: $TEST_FRAMEWORK"

  # Get changed files
  CHANGED_FILES=$(git diff --name-only main...HEAD 2>/dev/null || \n                  git diff --name-only HEAD~1 2>/dev/null || \n                  echo "")

  if [ -z "$CHANGED_FILES" ]; then
    echo "No changed files detected."
    echo "Use --file <path> to generate tests for specific file."
    exit 0
  fi

  echo ""
  echo "Analyzing changed files..."

  # Filter to source files only
  SOURCE_FILES=$(echo "$CHANGED_FILES" | grep -E '\.(ts|js|py|go)$' | \n                 grep -v '\.test\.' | \n                 grep -v '\.spec\.' | \n                 grep -v '_test\.go$' || echo "")

  if [ -z "$SOURCE_FILES" ]; then
    echo "No source files found in changes."
    exit 0
  fi

  echo "Found $(echo "$SOURCE_FILES" | wc -l) source file(s)"
  echo ""

  # Generate tests for each source file
  for file in $SOURCE_FILES; do
    if [ -f "$file" ]; then
      generate_test_file "$file" "$LANGUAGE" "$TEST_FRAMEWORK"
    fi
  done

  echo ""
  echo "═══════════════════════════════════════════════════════"
  echo "  JiT Test Generation Complete"
  echo "═══════════════════════════════════════════════════════"
}

# Run main function
main "$@"