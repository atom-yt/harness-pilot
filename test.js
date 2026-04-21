import { TemplateEngine } from 'plugins/harness-pilot/scripts/template-engine.js';

const engine = new TemplateEngine();
engine.setContext({ '@first': true });

const template = '{{#if @first}}FIRST {{/if}}';
const result = engine.render(template);
console.log('Template:', template);
console.log('Result:', result);
