/*
 * SPDX-License-Identifier: LicenseRef-w3c-3-clause-bsd-license-2008 OR LicenseRef-w3c-test-suite-license-2023
 */

// Each statement is one test per implementation (see statementTest in
// ../helpers.js). The test sends signed presentations to the verifier's
// exchange (see the README, "The exchange endpoint"): the conforming
// presentation must be accepted (200), and each presentation that breaks a
// rule must be refused (400).

import {
  credentialWith, listWith, setupStatementMatrix, statementTest
} from '../helpers.js';
import {describe} from 'mocha';
import {filterByTag} from 'vc-test-suite-implementations';

// Verifiers tagged for this suite. Each one gets its own describe below.
const tag = 'recognized-entities';
const {match: verifierImplementations} = filterByTag(
  {tags: [tag], property: 'verifiers'});

describe('3.2 RecognizedEntity', function() {
  setupStatementMatrix(this, verifierImplementations.keys());

  for(const name of verifierImplementations.keys()) {
    // The exchange field on this implementation's tagged verifier entry.
    // Without it, the tests are skipped.
    const exchange = verifierImplementations.get(name).settings.verifiers
      .find(v => v.tags?.includes(tag))?.exchange;
    describe(name, function() {
      statementTest({
        name, exchange, rowId: '3-2-recognizedentity-1'
      }, async ({accepts, refuses}) => {
        await accepts('the conforming presentation', listWith());
        await refuses('3.2 (1): subject type RecognizedIssuer',
          listWith(doc => {
            doc.credentialSubject[0].type = 'RecognizedIssuer';
          }));
      });
      // 3.2 (2) and (3) are about the recognizedIn object on the credential's
      // issuer, so the change goes to the credential.
      statementTest({
        name, exchange, rowId: '3-2-recognizedentity-2'
      }, async ({accepts, refuses}) => {
        await accepts('the conforming presentation', listWith());
        await refuses('3.2 (2): recognizedIn.id not a URL',
          credentialWith(doc => {
            doc.issuer.recognizedIn.id = 'not a url';
          }));
      });
      statementTest({
        name, exchange, rowId: '3-2-recognizedentity-3'
      }, async ({accepts, refuses}) => {
        await accepts('the conforming presentation', listWith());
        await refuses('3.2 (3): recognizedIn.type = 42', credentialWith(doc => {
          doc.issuer.recognizedIn.type = 42;
        }));
      });
      // The list is a RecognizedEntityCredential that breaks one rule of the
      // specification.
      statementTest({
        name, exchange, rowId: '3-2-recognizedentity-5'
      }, async ({accepts, refuses}) => {
        await accepts('the conforming presentation', listWith());
        await refuses('3.2 (5): subject type RecognizedIssuer',
          listWith(doc => {
            doc.credentialSubject[0].type = 'RecognizedIssuer';
          }));
      });
    });
  }
});
