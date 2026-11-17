/*
 * SPDX-License-Identifier: LicenseRef-w3c-3-clause-bsd-license-2008 OR LicenseRef-w3c-test-suite-license-2023
 */

import {describe, it} from 'mocha';
import {NORMATIVE, REQUIRED} from '../../tests/normative-statements.js';
import {expect} from 'chai';
import {fileURLToPath} from 'node:url';
import fs from 'node:fs';
import path from 'node:path';

// Structural check, no implementations needed. Every MUST/REQUIRED statement
// has exactly one row in tests/sections/ (one statementTests() call).
// SHOULD/MAY statements get no row and must not appear there.
const sectionsDir = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  '..', '..', 'tests', 'sections');
const sectionSource = fs.readdirSync(sectionsDir)
  .filter(f => f.endsWith('.spec.js'))
  .map(f => fs.readFileSync(path.join(sectionsDir, f), 'utf8'))
  .join('\n');

const required = new Set(REQUIRED);

describe('statement coverage', () => {
  for(const key of Object.keys(NORMATIVE)) {
    const refs = sectionSource.split(`statementTests('${key}')`).length - 1;
    if(required.has(key)) {
      it(`has a test for MUST/REQUIRED ${key}`, () => {
        expect(refs, `${key} referenced ${refs} times`).to.equal(1);
      });
    } else {
      it(`omits SHOULD/MAY ${key} from tests`, () => {
        expect(refs, `${key} referenced ${refs} times`).to.equal(0);
      });
    }
  }
});
