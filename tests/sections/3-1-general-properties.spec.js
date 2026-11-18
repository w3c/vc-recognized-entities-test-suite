/*
 * SPDX-License-Identifier: LicenseRef-w3c-3-clause-bsd-license-2008 OR LicenseRef-w3c-test-suite-license-2023
 */

// Each statement is one test per implementation (see statementTest in
// ../helpers.js). The test sends signed presentations to the verifier's
// exchange (see the README, "The exchange endpoint"): the conforming
// presentation must be accepted (200), and each presentation that breaks a
// rule must be refused (400).

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
      // The anchor is an issuer, but its issuer object has no type.
      statementTest({
        name, exchange, rowId: '3-1-general-properties-2'
      }, async ({accepts, refuses}) => {
        await accepts('the conforming presentation', listWith());
        await refuses('3.1 (2): issuer type deleted', listWith(doc => {
          delete doc.issuer.type;
        }));
      });
      statementTest({
        name, exchange, rowId: '3-1-general-properties-3'
      }, async ({accepts, refuses}) => {
        await accepts('the conforming presentation', listWith());
        await refuses('3.1 (3): issuer legalName = 42', listWith(doc => {
          doc.issuer.legalName = 42;
        }));
      });
      statementTest({
        name, exchange, rowId: '3-1-general-properties-4'
      }, async ({accepts, refuses}) => {
        await accepts('the conforming presentation', listWith());
        await refuses('3.1 (4): issuer image not a URL', listWith(doc => {
          doc.issuer.image = 'not a url';
        }));
      });
      statementTest({
        name, exchange, rowId: '3-1-general-properties-5'
      }, async ({accepts, refuses}) => {
        await accepts('the conforming presentation', listWith());
        await refuses('3.1 (5): issuer url not a URL', listWith(doc => {
          doc.issuer.url = 'not a url';
        }));
      });
      statementTest({
        name, exchange, rowId: '3-1-general-properties-6'
      }, async ({accepts, refuses}) => {
        await accepts('the conforming presentation', listWith());
        await refuses('3.1 (6): issuer sameAs not a URL', listWith(doc => {
          doc.issuer.sameAs = ['not a url'];
        }));
      });
    });
  }
});
