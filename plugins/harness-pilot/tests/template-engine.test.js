/**
 * Unit tests for Template Engine
 */

import { TemplateEngine } from '../scripts/template-engine.js';

// Test helper: compare output
function expectEqual(actual, expected) {
  const cleanActual = actual.replace(/\s+/g, ' ').trim();
  const cleanExpected = expected.replace(/\s+/g, ' ').trim();
  if (cleanActual !== cleanExpected) {
    console.error('Expected:', cleanExpected);
    console.error('Got:', cleanActual);
    throw new Error('Output does not match expected');
  }
}

// Test 1: Variable substitution
function testVariableSubstitution() {
  console.log('Test: Variable substitution');

  const engine = new TemplateEngine();
  engine.setContext({
    PROJECT_NAME: 'test-project',
    LANGUAGE: 'typescript',
    VERSION: '1.0.0',
  });

  const template = 'Project: {{PROJECT_NAME}}, Language: {{LANGUAGE}}, Version: {{VERSION}}';
  const result = engine.render(template);
  const expected = 'Project: test-project, Language: typescript, Version: 1.0.0';

  expectEqual(result, expected);
  console.log('✓ Pass\n');
}

// Test 2: Nested variable access
function testNestedVariables() {
  console.log('Test: Nested variable access');

  const engine = new TemplateEngine();
  engine.setContext({
    user: {
      name: 'John',
      email: 'john@example.com',
      settings: {
        theme: 'dark',
      },
    },
  });

  const template = 'User: {{user.name}}, Email: {{user.email}}, Theme: {{user.settings.theme}}';
  const result = engine.render(template);
  const expected = 'User: John, Email: john@example.com, Theme: dark';

  expectEqual(result, expected);
  console.log('✓ Pass\n');
}

// Test 3: Conditional rendering (true)
function testConditionalTrue() {
  console.log('Test: Conditional rendering (true)');

  const engine = new TemplateEngine();
  engine.setContext({
    FRAMEWORK: 'nextjs',
  });

  const template = 'Framework: {{#if FRAMEWORK}}{{FRAMEWORK}}{{/if}}';
  const result = engine.render(template);
  const expected = 'Framework: nextjs';

  expectEqual(result, expected);
  console.log('✓ Pass\n');
}

// Test 4: Conditional rendering (false)
function testConditionalFalse() {
  console.log('Test: Conditional rendering (false)');

  const engine = new TemplateEngine();
  engine.setContext({
    FRAMEWORK: null,
  });

  const template = 'Framework: {{#if FRAMEWORK}}{{FRAMEWORK}}{{/if}}';
  const result = engine.render(template);
  const expected = 'Framework: ';

  expectEqual(result, expected);
  console.log('✓ Pass\n');
}

// Test 5: Loop rendering
function testLoopRendering() {
  console.log('Test: Loop rendering');

  const engine = new TemplateEngine();
  engine.setContext({
    items: ['apple', 'banana', 'cherry'],
  });

  const template = '{{#each items}}- {{@index}}: {{this}}\n{{/each}}';
  const result = engine.render(template);
  const expected = '- 0: apple\n- 1: banana\n- 2: cherry\n';

  expectEqual(result, expected);
  console.log('✓ Pass\n');
}

// Test 6: Loop with objects
function testLoopWithObjects() {
  console.log('Test: Loop with objects');

  const engine = new TemplateEngine();
  engine.setContext({
    users: [
      { name: 'Alice', role: 'admin' },
      { name: 'Bob', role: 'user' },
    ],
  });

  const template = '{{#each users}}{{name}} ({{role}}) {{/each}}';
  const result = engine.render(template);
  const expected = 'Alice (admin) Bob (user) ';

  expectEqual(result, expected);
  console.log('✓ Pass\n');
}

// Test 7: Loop special variables
function testLoopSpecialVariables() {
  console.log('Test: Loop special variables (@first, @last)');

  const engine = new TemplateEngine();
  engine.setContext({
    items: ['a', 'b', 'c'],
  });

  const template = '{{#each items}}{{#if @first}}FIRST {{/if}}{{this}} {{#if @last}}LAST {{/if}}{{/each}}';
  const result = engine.render(template);
  const expected = 'FIRST a b c LAST ';

  expectEqual(result, expected);
  console.log('✓ Pass\n');
}

// Test 8: Empty loop
function testEmptyLoop() {
  console.log('Test: Empty loop');

  const engine = new TemplateEngine();
  engine.setContext({
    items: [],
  });

  const template = 'Items: {{#each items}}{{this}} {{/each}}';
  const result = engine.render(template);
  const expected = 'Items: ';

  expectEqual(result, expected);
  console.log('✓ Pass\n');
}

// Test 9: Complex template
function testComplexTemplate() {
  console.log('Test: Complex template');

  const engine = new TemplateEngine();
  engine.setContext({
    PROJECT_NAME: 'my-app',
    LANGUAGE: 'typescript',
    FRAMEWORK: 'nextjs',
    DEPENDENCIES: ['react', 'next', 'typescript'],
    VERSION: '2.0.0',
  });

  const template = `
# {{PROJECT_NAME}}

Language: {{LANGUAGE}}
{{#if FRAMEWORK}}
Framework: {{FRAMEWORK}}
{{/if}}
{{#if VERSION}}
Version: {{VERSION}}
{{/if}}

Dependencies:
{{#each DEPENDENCIES}}
- {{this}}
{{/each}}
  `.trim();

  const result = engine.render(template);
  const expected = `# my-app Language: typescript Framework: nextjs Version: 2.0.0 Dependencies: - react - next - typescript`;

  expectEqual(result, expected);
  console.log('✓ Pass\n');
}

// Test 10: Missing variable (leave as-is)
function testMissingVariable() {
  console.log('Test: Missing variable (leave as-is)');

  const engine = new TemplateEngine();
  engine.setContext({
    NAME: 'test',
  });

  const template = 'Name: {{NAME}}, Missing: {{MISSING_VAR}}';
  const result = engine.render(template);
  const expected = 'Name: test, Missing: {{MISSING_VAR}}';

  expectEqual(result, expected);
  console.log('✓ Pass\n');
}

// Test 11: Escaped braces
function testEscapedBraces() {
  console.log('Test: Escaped braces');

  const engine = new TemplateEngine();
  engine.setContext({});

  const template = 'Normal text with {braces}';
  const result = engine.render(template);
  const expected = 'Normal text with {braces}';

  expectEqual(result, expected);
  console.log('✓ Pass\n');
}

// Test 12: Newline preservation
function testNewlinePreservation() {
  console.log('Test: Newline preservation');

  const engine = new TemplateEngine();
  engine.setContext({
    NAME: 'test',
  });

  const template = 'Line 1\nLine 2\n{{NAME}}\nLine 4';
  const result = engine.render(template);
  const expected = 'Line 1\nLine 2\ntest\nLine 4';

  expectEqual(result, expected);
  console.log('✓ Pass\n');
}

// Run all tests
function runAllTests() {
  console.log('═'.repeat(50));
  console.log('  Template Engine Unit Tests');
  console.log('═'.repeat(50) + '\n');

  const tests = [
    testVariableSubstitution,
    testNestedVariables,
    testConditionalTrue,
    testConditionalFalse,
    testLoopRendering,
    testLoopWithObjects,
    testLoopSpecialVariables,
    testEmptyLoop,
    testComplexTemplate,
    testMissingVariable,
    testEscapedBraces,
    testNewlinePreservation,
  ];

  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    try {
      test();
      passed++;
    } catch (error) {
      console.error('✗ Fail:', error.message, '\n');
      failed++;
    }
  }

  console.log('═'.repeat(50));
  console.log(`  Results: ${passed} passed, ${failed} failed`);
  console.log('═'.repeat(50));

  return failed === 0 ? 0 : 1;
}

// Export for Node.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    runAllTests,
    TemplateEngine,
  };
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  process.exit(runAllTests());
}