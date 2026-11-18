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

// Validator code that does not parse as an ECMAScript module.
const NOT_A_MODULE = 'this is not a module (';

// Validator code whose default export is not a function.
const DEFAULT_EXPORT_NOT_A_FUNCTION = 'export default 42;';

describe('4.4.1 JavaScript Validator Processing', function() {
  setupStatementMatrix(this, verifierImplementations.keys());

  for(const name of verifierImplementations.keys()) {
    // The exchange field on this implementation's tagged verifier entry.
    // Without it, the tests are skipped.
    const exchange = verifierImplementations.get(name).settings.verifiers
      .find(v => v.tags?.includes(tag))?.exchange;
    describe(name, function() {
      statementTest({
        name, exchange, rowId: '4-4-1-javascript-validator-processing-2'
      }, async ({accepts, refuses}) => {
        await accepts('a conforming JavaScript validator',
          listWithValidator(CONFORMING_VALIDATOR_CODE));
        await refuses('4.4.1 (2): code is not a module',
          listWithValidator(NOT_A_MODULE));
        await refuses('4.4.1 (2): default export is not a function',
          listWithValidator(DEFAULT_EXPORT_NOT_A_FUNCTION));
      });
    });
  }
});
