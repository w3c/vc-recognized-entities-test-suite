/*
 * SPDX-License-Identifier: LicenseRef-w3c-3-clause-bsd-license-2008 OR LicenseRef-w3c-test-suite-license-2023
 */

// Each statement is one test per implementation (see statementTest in
// ../helpers.js). The test sends signed presentations to the verifier's
// exchange (see the README, "The exchange endpoint"): the conforming
// presentation must be accepted (200), and each presentation that breaks a
// rule must be refused (400).

import {
  FIXTURES_URL, listWith, setupStatementMatrix, statementTest, validatorOf
} from '../helpers.js';
import {describe} from 'mocha';
import {filterByTag} from 'vc-test-suite-implementations';

// Verifiers tagged for this suite. Each one gets its own describe below.
const tag = 'recognized-entities';
const {match: verifierImplementations} = filterByTag(
  {tags: [tag], property: 'verifiers'});

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
        await refuses('3.5 (1): validator id deleted', listWith(doc => {
          delete validatorOf(doc).id;
        }));
      });
      statementTest({
        name, exchange, rowId: '3-5-credential-validators-2'
      }, async ({accepts, refuses}) => {
        await accepts('the conforming presentation', listWith());
        // The same JSON Schema, hosted with the suite's fixtures (see the
        // README, "Hosted fixtures"), so the verifier fetches it.
        await accepts('validator id is an https URL that links to the file',
          listWith(doc => {
            validatorOf(doc).id =
              FIXTURES_URL + 'validators/credential-subject.schema.json';
          }));
        await refuses('3.5 (2): validator id = schema.json', listWith(doc => {
          validatorOf(doc).id = 'schema.json';
        }));
      });
      statementTest({
        name, exchange, rowId: '3-5-credential-validators-4'
      }, async ({accepts, refuses}) => {
        await accepts('the conforming presentation', listWith());
        await refuses('3.5 (4): validator type JsonSchema', listWith(doc => {
          validatorOf(doc).type = 'JsonSchema';
        }));
      });
      statementTest({
        name, exchange, rowId: '3-5-credential-validators-5'
      }, async ({accepts, refuses}) => {
        await accepts('the conforming presentation', listWith());
        await refuses('3.5 (5): validator mediaType deleted', listWith(doc => {
          delete validatorOf(doc).mediaType;
        }));
        await refuses('3.5 (5): validator mediaType text/plain',
          listWith(doc => {
            validatorOf(doc).mediaType = 'text/plain';
          }));
      });
    });
  }
});
