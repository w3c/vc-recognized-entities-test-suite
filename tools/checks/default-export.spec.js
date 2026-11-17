/*
 * SPDX-License-Identifier: LicenseRef-w3c-3-clause-bsd-license-2008 OR LicenseRef-w3c-test-suite-license-2023
 */

import * as acorn from 'acorn';
import {describe, it} from 'mocha';
import {defaultExportIsFunction} from './validator-code.js';
import {expect} from 'chai';

// Unit tests for the 4.4.1 (2) module check: the default export of the
// validator code is a function. Runs without an implementation.
const parse = code => acorn.parse(code,
  {ecmaVersion: 'latest', sourceType: 'module'});

describe('defaultExportIsFunction (4.4.1-2)', () => {
  const functions = {
    'export default function': 'export default function v() {}',
    'export default async function': 'export default async function v() {}',
    'export default arrow': 'export default () => 1;',
    'function, export default name': 'function v() {}\nexport default v;',
    'function, export {f as default}':
      'function f() {}\nexport {f as default};',
    'const arrow, export default name':
      'const f = () => 1;\nexport default f;',
    'const arrow, export {f as default}':
      'const f = () => 1;\nexport {f as default};',
    'exported const arrow, export {f as default}':
      'export const f = () => 1;\nexport {f as default};'
  };
  for(const [name, code] of Object.entries(functions)) {
    it(`accepts ${name}`, () => {
      expect(defaultExportIsFunction(parse(code))).to.equal(true);
    });
  }
  const others = {
    'export default 42': 'export default 42;',
    'a number exported as default': 'const f = 42;\nexport {f as default};',
    'a let that may be reassigned': 'let f = () => 1;\nexport default f;',
    'no default export': 'export const f = () => 1;'
  };
  for(const [name, code] of Object.entries(others)) {
    it(`rejects ${name}`, () => {
      expect(defaultExportIsFunction(parse(code))).to.equal(false);
    });
  }
});
