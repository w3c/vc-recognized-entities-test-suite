/*
 * SPDX-License-Identifier: LicenseRef-w3c-3-clause-bsd-license-2008 OR LicenseRef-w3c-test-suite-license-2023
 */

// Each statement is one test per implementation: the conforming presentation
// must get 200, and the presentation with the statement broken must get 400
// (see the README, "The exchange endpoint").

import {listWith, setupStatementMatrix, statementTest} from '../helpers.js';
import {describe} from 'mocha';
import {filterByTag} from 'vc-test-suite-implementations';

// Verifiers tagged for this suite. Each one gets its own describe below.
const tag = 'recognized-entities';
const {match: verifierImplementations} = filterByTag(
  {tags: [tag], property: 'verifiers'});

describe('3.4 RecognizedEntityCredential', function() {
  setupStatementMatrix(this, verifierImplementations.keys());

  for(const name of verifierImplementations.keys()) {
    // The exchange field on this implementation's tagged verifier entry.
    // Without it, the tests are skipped.
    const exchange = verifierImplementations.get(name).settings.verifiers
      .find(v => v.tags?.includes(tag))?.exchange;
    describe(name, function() {
      // A verifiable credential without an issuer does not conform to the
      // Verifiable Credentials Data Model.
      statementTest({
        name, exchange, rowId: '3-4-recognizedentitycredential-1'
      }, async ({accepts, refuses}) => {
        await accepts('the conforming presentation', listWith());
        await refuses('issuer deleted', listWith(doc => {
          delete doc.issuer;
        }));
      });
      statementTest({
        name, exchange, rowId: '3-4-recognizedentitycredential-3'
      }, async ({accepts, refuses}) => {
        await accepts('the conforming presentation', listWith());
        await refuses('type without RecognizedEntityCredential',
          listWith(doc => {
            doc.type = ['VerifiableCredential'];
          }));
      });
    });
  }
});
