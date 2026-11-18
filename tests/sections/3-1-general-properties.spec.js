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

describe('3.1 General Properties', function() {
  setupStatementMatrix(this, verifierImplementations.keys());

  for(const name of verifierImplementations.keys()) {
    // The exchange field on this implementation's tagged verifier entry.
    // Without it, the tests are skipped.
    const exchange = verifierImplementations.get(name).settings.verifiers
      .find(v => v.tags?.includes(tag))?.exchange;
    describe(name, function() {
      statementTest({
        name, exchange, rowId: '3-1-general-properties-2',
        // The anchor is an issuer, but its issuer object has no type.
        broken: listWith(doc => {
          delete doc.issuer.type;
        })
      });
      statementTest({
        name, exchange, rowId: '3-1-general-properties-3',
        broken: listWith(doc => {
          doc.issuer.legalName = 42;
        })
      });
      statementTest({
        name, exchange, rowId: '3-1-general-properties-4',
        broken: listWith(doc => {
          doc.issuer.image = 'not a url';
        })
      });
      statementTest({
        name, exchange, rowId: '3-1-general-properties-5',
        broken: listWith(doc => {
          doc.issuer.url = 'not a url';
        })
      });
      statementTest({
        name, exchange, rowId: '3-1-general-properties-6',
        broken: listWith(doc => {
          doc.issuer.sameAs = ['not a url'];
        })
      });
    });
  }
});
