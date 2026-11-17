/*
 * SPDX-License-Identifier: LicenseRef-w3c-3-clause-bsd-license-2008 OR LicenseRef-w3c-test-suite-license-2023
 */

import {describe, it} from 'mocha';
import {expect} from 'chai';
import {expectRepeatable} from '../../tests/statement-suite.js';

// The checker behind 4-4-1-1-javascript-credential-validation-function-7 (same
// credential and options, same result). A validator that uses the clock or
// random numbers must fail it, so a passing matrix row cannot come from a
// checker that accepts everything.
const validator = code => ({
  type: 'CredentialValidator',
  id: 'data:text/javascript,' + encodeURIComponent(code),
  mediaType: 'text/javascript'
});
const head = 'export default function validate(credential, options) {\n';
const problem = title => ({type: 'https://anchor.example/problems/x', title});
const pure = validator(head +
  '  return {valid: true, errors: [], warnings: []};\n}\n');
const usesClock = validator(head +
  `  return {valid: true, errors: [], warnings: [${JSON.stringify(
    problem('x'))}].map(w => ({...w, title: String(Date.now())}))};\n}\n`);
const usesRandom = validator(head +
  `  return {valid: true, errors: [], warnings: [${JSON.stringify(
    problem('x'))}].map(w => ({...w, title: String(Math.random())}))};\n}\n`);

describe('repeatability checker (4.4.1.1, same input same result)', () => {
  it('accepts a validator that ignores clock and random numbers', async () => {
    await expectRepeatable(pure, {type: 'VerifiableCredential'}, {});
  });

  it('refuses a validator that reads the clock', async () => {
    let failed = false;
    try {
      await expectRepeatable(usesClock, {type: 'VerifiableCredential'}, {});
    } catch(error) {
      failed = true;
    }
    expect(failed, 'a clock-dependent validator must fail').to.equal(true);
  });

  it('refuses a validator that reads random numbers', async () => {
    let failed = false;
    try {
      await expectRepeatable(usesRandom, {type: 'VerifiableCredential'}, {});
    } catch(error) {
      failed = true;
    }
    expect(failed, 'a random-dependent validator must fail').to.equal(true);
  });
});
