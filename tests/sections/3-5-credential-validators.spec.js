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

// The credential validator of the anchor's list, in the document `doc`.
const validatorOf = doc =>
  doc.credentialSubject[0].recognizedTo.credentialValidator;

describe('3.5 Credential Validators', function() {
  setupStatementMatrix(this, verifierImplementations.keys());

  for(const name of verifierImplementations.keys()) {
    // The exchange field on this implementation's tagged verifier entry.
    // Without it, the tests are skipped.
    const exchange = verifierImplementations.get(name).settings.verifiers
      .find(v => v.tags?.includes(tag))?.exchange;
    describe(name, function() {
      statementTest({
        name, exchange, rowId: '3-5-credential-validators-1'
      }, async ({accepts, refuses}) => {
        await accepts('the conforming presentation', listWith());
        await refuses('validator id deleted', listWith(doc => {
          delete validatorOf(doc).id;
        }));
      });
      statementTest({
        name, exchange, rowId: '3-5-credential-validators-2'
      }, async ({accepts, refuses}) => {
        await accepts('the conforming presentation', listWith());
        await refuses('validator id = schema.json', listWith(doc => {
          validatorOf(doc).id = 'schema.json';
        }));
      });
      statementTest({
        name, exchange, rowId: '3-5-credential-validators-4'
      }, async ({accepts, refuses}) => {
        await accepts('the conforming presentation', listWith());
        await refuses('validator type JsonSchema', listWith(doc => {
          validatorOf(doc).type = 'JsonSchema';
        }));
      });
      statementTest({
        name, exchange, rowId: '3-5-credential-validators-5'
      }, async ({accepts, refuses}) => {
        await accepts('the conforming presentation', listWith());
        await refuses('validator mediaType deleted', listWith(doc => {
          delete validatorOf(doc).mediaType;
        }));
      });
    });
  }
});
