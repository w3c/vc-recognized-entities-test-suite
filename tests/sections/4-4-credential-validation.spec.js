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

// Validator code that recognizes only the chain and action options, so it
// throws an UNRECOGNIZED_OPTION_ERROR for evaluationDateTime, which every
// verifier passes (4.4).
const THROWS_UNRECOGNIZED_OPTION = `
export default function validate(credential, options) {
  const known = ['chain', 'action'];
  for(const name of Object.keys(options)) {
    if(!known.includes(name)) {
      const error = new Error('Unrecognized option "' + name + '".');
      error.type =
        'https://www.w3.org/TR/vc-data-model#UNRECOGNIZED_OPTION_ERROR';
      throw error;
    }
  }
  return {valid: true, errors: [], warnings: []};
}
`;

describe('4.4 Credential Validation', function() {
  setupStatementMatrix(this, verifierImplementations.keys());

  for(const name of verifierImplementations.keys()) {
    // The exchange field on this implementation's tagged verifier entry.
    // Without it, the tests are skipped.
    const exchange = verifierImplementations.get(name).settings.verifiers
      .find(v => v.tags?.includes(tag))?.exchange;
    describe(name, function() {
      // A validator that throws makes credential validation fail (4.4.1).
      statementTest({
        name, exchange, rowId: '4-4-credential-validation-2'
      }, async ({accepts, refuses}) => {
        await accepts('a conforming JavaScript validator',
          listWithValidator(CONFORMING_VALIDATOR_CODE));
        await refuses('4.4 (2): validator throws UNRECOGNIZED_OPTION_ERROR',
          listWithValidator(THROWS_UNRECOGNIZED_OPTION));
      });
    });
  }
});
