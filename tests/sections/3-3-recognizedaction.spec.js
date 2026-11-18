/*
 * SPDX-License-Identifier: LicenseRef-w3c-3-clause-bsd-license-2008 OR LicenseRef-w3c-test-suite-license-2023
 */

// Each statement is one test per implementation (see statementTest in
// ../helpers.js). The test sends signed presentations to the verifier's
// exchange (see the README, "The exchange endpoint"): the conforming
// presentation must be accepted (200), and each presentation that breaks a
// rule must be refused (400).

import {
  listWith, runtimeDateTime, setupStatementMatrix, statementTest,
  unsatisfiedValidator
} from '../helpers.js';
import {describe} from 'mocha';
import {filterByTag} from 'vc-test-suite-implementations';

// Verifiers tagged for this suite. Each one gets its own describe below.
const tag = 'recognized-entities';
const {match: verifierImplementations} = filterByTag(
  {tags: [tag], property: 'verifiers'});

describe('3.3 RecognizedAction', function() {
  setupStatementMatrix(this, verifierImplementations.keys());

  for(const name of verifierImplementations.keys()) {
    // The exchange field on this implementation's tagged verifier entry.
    // Without it, the tests are skipped.
    const exchange = verifierImplementations.get(name).settings.verifiers
      .find(v => v.tags?.includes(tag))?.exchange;
    describe(name, function() {
      statementTest({
        name, exchange, rowId: '3-3-recognizedaction-1'
      }, async ({accepts, refuses}) => {
        await accepts('the conforming presentation', listWith());
        await refuses('3.3 (1): recognizedTo.type RecognizedEntity',
          listWith(doc => {
            doc.credentialSubject[0].recognizedTo.type = 'RecognizedEntity';
          }));
      });
      statementTest({
        name, exchange, rowId: '3-3-recognizedaction-2'
      }, async ({accepts, refuses}) => {
        await accepts('the conforming presentation', listWith());
        await refuses('3.3 (2): credentialValidator = []', listWith(doc => {
          doc.credentialSubject[0].recognizedTo.credentialValidator = [];
        }));
      });
      // Two validators: the credential satisfies the first, not the second.
      statementTest({
        name, exchange, rowId: '3-3-recognizedaction-3'
      }, async ({accepts, refuses}) => {
        await accepts('the conforming presentation', listWith());
        await accepts('two validators, both satisfied', listWith(doc => {
          const action = doc.credentialSubject[0].recognizedTo;
          action.credentialValidator =
            [action.credentialValidator, action.credentialValidator];
        }));
        await refuses('3.3 (3): second validator not satisfied',
          listWith(doc => {
            const action = doc.credentialSubject[0].recognizedTo;
            action.credentialValidator =
              [action.credentialValidator, unsatisfiedValidator];
          }));
      });
      statementTest({
        name, exchange, rowId: '3-3-recognizedaction-4'
      }, async ({accepts, refuses}) => {
        await accepts('the conforming presentation', listWith());
        await refuses('3.3 (4): validFrom has milliseconds', listWith(doc => {
          doc.credentialSubject[0].recognizedTo.validFrom =
            '2025-01-01T00:00:00.500Z';
        }));
      });
      // validUntil is in the future, so only its time zone breaks the rule.
      statementTest({
        name, exchange, rowId: '3-3-recognizedaction-6'
      }, async ({accepts, refuses}) => {
        await accepts('the conforming presentation', listWith());
        await refuses('3.3 (6): validUntil not in UTC', listWith(doc => {
          doc.credentialSubject[0].recognizedTo.validUntil =
            runtimeDateTime('+01:00');
        }));
      });
    });
  }
});
