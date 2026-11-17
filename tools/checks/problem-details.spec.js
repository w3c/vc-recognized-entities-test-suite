/*
 * SPDX-License-Identifier: LicenseRef-w3c-3-clause-bsd-license-2008 OR LicenseRef-w3c-test-suite-license-2023
 */

import {describe, it} from 'mocha';
import {expect} from 'chai';
import {problemDetailsViolations} from './validator-code.js';

// The checker behind 4-4-1-1-javascript-credential-validation-function-6
// ("each item in errors and warnings MUST conform to ProblemDetails"). It is
// tested here with known items, so a passing matrix row cannot come from a
// checker that accepts everything.
describe('ProblemDetails item checker (4.4.1.1, errors and warnings)', () => {
  it('accepts an item with a type and a title', () => {
    expect(problemDetailsViolations(
      {type: 'https://anchor.example/problems/x', title: 'X'})).to.deep.equal([]);
  });

  it('refuses an item with no type', () => {
    expect(problemDetailsViolations({title: 'X'})).to.not.deep.equal([]);
  });

  it('refuses an item that is a string', () => {
    expect(problemDetailsViolations('an error')).to.not.deep.equal([]);
  });
});
