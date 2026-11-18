/*
 * SPDX-License-Identifier: LicenseRef-w3c-3-clause-bsd-license-2008 OR LicenseRef-w3c-test-suite-license-2023
 */

// Each statement is one test per implementation (see statementTest in
// ../helpers.js). The test sends signed presentations to the verifier's
// exchange (see the README, "The exchange endpoint"): the conforming
// presentation must be accepted (200), and each presentation that breaks a
// rule must be refused (400).

import {
  CONFORMING_VALIDATOR_CODE, listWithValidator, setupStatementMatrix,
  statementTest
} from '../helpers.js';
import {describe} from 'mocha';
import {filterByTag} from 'vc-test-suite-implementations';

// Verifiers tagged for this suite. Each one gets its own describe below.
const tag = 'recognized-entities';
const {match: verifierImplementations} = filterByTag(
  {tags: [tag], property: 'verifiers'});

// Validator code that returns `result` as its validation result.
const returns = result => `
export default function validate() {
  return ${JSON.stringify(result)};
}
`;

// A ProblemDetails object (VC Data Model v2.0, 7.1.4).
const problem = {
  type: 'https://anchor.example/problems#NOTE',
  title: 'A note from the validator'
};

describe('4.4.1.1 JavaScript Credential Validation Function', function() {
  setupStatementMatrix(this, verifierImplementations.keys());

  for(const name of verifierImplementations.keys()) {
    // The exchange field on this implementation's tagged verifier entry.
    // Without it, the tests are skipped.
    const exchange = verifierImplementations.get(name).settings.verifiers
      .find(v => v.tags?.includes(tag))?.exchange;
    describe(name, function() {
      statementTest({
        name, exchange,
        rowId: '4-4-1-1-javascript-credential-validation-function-2'
      }, async ({accepts, refuses}) => {
        await accepts('a conforming JavaScript validator',
          listWithValidator(CONFORMING_VALIDATOR_CODE));
        await refuses('4.4.1.1 (2): result without valid',
          listWithValidator(returns({errors: [], warnings: []})));
        await refuses('4.4.1.1 (2): valid is not a boolean',
          listWithValidator(returns({valid: 'true'})));
      });
      statementTest({
        name, exchange,
        rowId: '4-4-1-1-javascript-credential-validation-function-4'
      }, async ({accepts, refuses}) => {
        await accepts('a conforming JavaScript validator',
          listWithValidator(CONFORMING_VALIDATOR_CODE));
        await refuses('4.4.1.1 (4): valid true with an error',
          listWithValidator(returns({valid: true, errors: [problem]})));
      });
      statementTest({
        name, exchange,
        rowId: '4-4-1-1-javascript-credential-validation-function-6'
      }, async ({accepts, refuses}) => {
        await accepts('valid true with a ProblemDetails warning',
          listWithValidator(returns({valid: true, warnings: [problem]})));
        await refuses('4.4.1.1 (6): warning is not a ProblemDetails object',
          listWithValidator(returns({valid: true, warnings: [42]})));
      });
    });
  }
});
