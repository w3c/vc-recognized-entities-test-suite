#!/usr/bin/env node
/*
 * SPDX-License-Identifier: LicenseRef-w3c-3-clause-bsd-license-2008 OR LicenseRef-w3c-test-suite-license-2023
 */

// Regenerates tests/sections/*.spec.js from tests/normative-statements.js.
// Every MUST/REQUIRED statement gets one matrix row, in its section file.
// SHOULD/MAY statements stay in NORMATIVE and the inventory, but get no row.
// Each row is built by statementTests() in tests/statement-suite.js, which
// records a cell for every column, skipped when the statement cannot be
// tested yet. Do not hand-edit the generated files; edit the template here.

import {NORMATIVE, REQUIRED, SECTION} from '../tests/normative-statements.js';
import {fileURLToPath} from 'node:url';
import fs from 'node:fs';
import path from 'node:path';

const here = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(here, '..', 'tests', 'sections');

const HEADER = `/*
 * SPDX-License-Identifier: LicenseRef-w3c-3-clause-bsd-license-2008 OR LicenseRef-w3c-test-suite-license-2023
 */
`;

export function slugify(section) {
  return section.toLowerCase().replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// Keys that get a row: MUST/REQUIRED only.
export function testedKeys() {
  const required = new Set(REQUIRED);
  return Object.keys(NORMATIVE).filter(key => required.has(key));
}

export function groupBySection() {
  const groups = new Map();
  for(const key of testedKeys()) {
    const section = SECTION[key];
    if(!groups.has(section)) {
      groups.set(section, []);
    }
    groups.get(section).push(key);
  }
  return groups;
}

// Single-quoted JS string literal.
function quote(text) {
  return '\'' + text.replace(/\\/g, '\\\\').replace(/'/g, '\\\'') + '\'';
}

export function renderSection(section, keys) {
  const lines = [
    HEADER,
    'import {setupStatementMatrix, statementTests} from ' +
      '\'../statement-suite.js\';',
    'import {describe} from \'mocha\';',
    '',
    `// Spec section: ${section}`,
    `describe(${quote(section)}, function() {`,
    '  setupStatementMatrix(this);',
    ''
  ];
  for(const key of keys) {
    lines.push(`  // ${key}`);
    lines.push(`  statementTests(${quote(key)});`);
    lines.push('');
  }
  lines.pop();
  lines.push('});', '');
  return lines.join('\n');
}

export function main() {
  fs.mkdirSync(outDir, {recursive: true});
  for(const f of fs.readdirSync(outDir)) {
    if(f.endsWith('.spec.js')) {
      fs.unlinkSync(path.join(outDir, f));
    }
  }
  const groups = groupBySection();
  for(const [section, keys] of groups) {
    const file = path.join(outDir, `${slugify(section)}.spec.js`);
    fs.writeFileSync(file, renderSection(section, keys));
  }
  console.log(`wrote ${groups.size} section files, ` +
    `${testedKeys().length} statement rows ` +
    `(${Object.keys(NORMATIVE).length - testedKeys().length} ` +
      'SHOULD/MAY omitted)');
}

if(process.argv[1] && import.meta.url === `file://${process.argv[1]}`) {
  main();
}
