/*
 * SPDX-License-Identifier: LicenseRef-w3c-3-clause-bsd-license-2008 OR LicenseRef-w3c-test-suite-license-2023
 */

// Each statement is one test per implementation: the conforming presentation
// must get 200, and the presentation with the statement broken must get 400
// (see the README, "The exchange endpoint").

import {
  listWith, runtimeDateTime, setupStatementMatrix, statementTest
} from '../helpers.js';
import {describe} from 'mocha';
import {filterByTag} from 'vc-test-suite-implementations';

// Verifiers tagged for this suite. Each one gets its own describe below.
const tag = 'recognized-entities';
const {match: verifierImplementations} = filterByTag(
  {tags: [tag], property: 'verifiers'});

// A credential validator that the known issuer credential does not satisfy:
// its schema requires a property the credential does not have.
const unsatisfiedValidator = {
  type: 'CredentialValidator',
  id: 'data:application/schema+json,' + encodeURIComponent(JSON.stringify({
    type: 'object', required: ['notInTheCredential']
  })),
  mediaType: 'application/schema+json'
};

describe('3.3 RecognizedAction', function() {
  setupStatementMatrix(this, verifierImplementations.keys());

  for(const name of verifierImplementations.keys()) {
    // The exchange field on this implementation's tagged verifier entry.
    // Without it, the tests are skipped.
    const exchange = verifierImplementations.get(name).settings.verifiers
      .find(v => v.tags?.includes(tag))?.exchange;
    describe(name, function() {
      statementTest({
        name, exchange, rowId: '3-3-recognizedaction-1',
        broken: listWith(doc => {
          doc.credentialSubject[0].recognizedTo.type = 'RecognizedEntity';
        })
      });
      statementTest({
        name, exchange, rowId: '3-3-recognizedaction-2',
        broken: listWith(doc => {
          doc.credentialSubject[0].recognizedTo.credentialValidator = [];
        })
      });
      // Two validators: the credential satisfies the first, not the second.
      statementTest({
        name, exchange, rowId: '3-3-recognizedaction-3',
        broken: listWith(doc => {
          const action = doc.credentialSubject[0].recognizedTo;
          action.credentialValidator =
            [action.credentialValidator, unsatisfiedValidator];
        })
      });
      statementTest({
        name, exchange, rowId: '3-3-recognizedaction-4',
        broken: listWith(doc => {
          doc.credentialSubject[0].recognizedTo.validFrom =
            '2025-01-01T00:00:00.500Z';
        })
      });
      // validUntil is in the future, so only its time zone breaks the rule.
      statementTest({
        name, exchange, rowId: '3-3-recognizedaction-6',
        broken: listWith(doc => {
          doc.credentialSubject[0].recognizedTo.validUntil =
            runtimeDateTime('+01:00');
        })
      });
    });
  }
});
