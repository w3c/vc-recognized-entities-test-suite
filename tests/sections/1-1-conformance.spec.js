/*
 * SPDX-License-Identifier: LicenseRef-w3c-3-clause-bsd-license-2008 OR LicenseRef-w3c-test-suite-license-2023
 */

// Each statement is one test per implementation. Its checks run in order, and
// their failures are collected, so the test fails once with all of them.
//
// 1.1 (2) posts signed presentations to the verifier's exchange URL, used only
// as an endpoint (see the README, "The exchange endpoint"): the conforming
// presentation must get 200, and each presentation with one section 3 rule
// broken must get 400.

import {
  anchorListWith, attempt, knownCredentialDocument, knownIssuerCredential,
  participate, recordRow, runtimeDateTime, setupStatementMatrix
} from '../helpers.js';
import {describe, it} from 'mocha';
import {expect} from 'chai';
import {filterByTag} from 'vc-test-suite-implementations';
import {LINK} from '../normative-links.js';
import {NORMATIVE} from '../normative-statements.js';

// Verifiers tagged for this suite. Each one gets its own describe below.
const tag = 'recognized-entities';
const {match: verifierImplementations} = filterByTag(
  {tags: [tag], property: 'verifiers'});

describe('1.1 Conformance', function() {
  setupStatementMatrix(this, verifierImplementations.keys());

  for(const name of verifierImplementations.keys()) {
    // The exchange field on this implementation's tagged verifier entry.
    // Without it, the test is skipped.
    const exchange = verifierImplementations.get(name).settings.verifiers
      .find(v => v.tags?.includes(tag))?.exchange;
    describe(name, function() {
      it(`${NORMATIVE['1-1-conformance-2']}`, async function() {
        this.test.cell = {columnId: name, rowId: '1-1-conformance-2',
          statement: NORMATIVE['1-1-conformance-2']};
        this.test.link = LINK['1-1-conformance-2'];
        recordRow('1-1-conformance-2', NORMATIVE['1-1-conformance-2']);
        if(!exchange) {
          this.test.cell.skipMessage = 'no verifier exchange configured';
          this.skip();
        }
        const failures = [];
        // Sends the presentation to the verifier exchange; it must be
        // accepted (200) or refused as invalid input (400).
        const sends = (label, status, documents) => attempt(
          failures, label, async () => {
            const reply = await participate(exchange, await documents());
            expect(reply.status, label).to.equal(status);
          });
        const accepts = (label, documents) => sends(label, 200, documents);
        const refuses = (label, documents) => sends(label, 400, documents);
        // The known issuer credential and the anchor's list, with `change`
        // applied to the list, or to the credential.
        const listWith = change => async () =>
          [await knownIssuerCredential(), await anchorListWith(change)];
        const credentialWith = change => async () =>
          [await knownCredentialDocument(change), await anchorListWith()];

        await accepts('the conforming presentation', listWith(() => {}));
        await refuses('3.1 (2): delete issuer type', listWith(doc => {
          delete doc.issuer.type;
        }));
        await refuses('3.1 (3): issuer legalName = 42', listWith(doc => {
          doc.issuer.legalName = 42;
        }));
        await refuses('3.1 (4): issuer image not a URL', listWith(doc => {
          doc.issuer.image = 'not a url';
        }));
        await refuses('3.1 (5): issuer url not a URL', listWith(doc => {
          doc.issuer.url = 'not a url';
        }));
        await refuses('3.1 (6): issuer sameAs not a URL', listWith(doc => {
          doc.issuer.sameAs = ['not a url'];
        }));
        await refuses('3.2 (1): subject type RecognizedIssuer',
          listWith(doc => {
            doc.credentialSubject[0].type = 'RecognizedIssuer';
          }));
        await refuses('3.2 (2): recognizedIn.id not a URL',
          credentialWith(doc => {
            doc.issuer.recognizedIn.id = 'not a url';
          }));
        await refuses('3.2 (3): recognizedIn.type = 42', credentialWith(doc => {
          doc.issuer.recognizedIn.type = 42;
        }));
        await refuses('3.2 (5): subject type RecognizedIssuer',
          listWith(doc => {
            doc.credentialSubject[0].type = 'RecognizedIssuer';
          }));
        await refuses('3.3 (1): recognizedTo.type RecognizedEntity',
          listWith(doc => {
            doc.credentialSubject[0].recognizedTo.type =
              'RecognizedEntity';
          }));
        await refuses('3.3 (2): credentialValidator = []', listWith(doc => {
          doc.credentialSubject[0].recognizedTo.credentialValidator = [];
        }));
        await refuses('3.3 (4): validFrom has milliseconds', listWith(doc => {
          doc.credentialSubject[0].recognizedTo.validFrom =
            '2025-01-01T00:00:00.500Z';
        }));
        await refuses('3.3 (6): validUntil 30 days from now', listWith(doc => {
          doc.credentialSubject[0].recognizedTo.validUntil =
            runtimeDateTime('+01:00');
        }));
        await refuses('3.4 (1): delete the issuer', listWith(doc => {
          delete doc.issuer;
        }));
        await refuses('3.4 (3): type without RecognizedEntityCredential',
          listWith(doc => {
            doc.type = ['VerifiableCredential'];
          }));
        await refuses('3.5 (1): delete validator id', listWith(doc => {
          delete doc.credentialSubject[0].recognizedTo.credentialValidator.id;
        }));
        await refuses('3.5 (2): validator id = schema.json', listWith(doc => {
          doc.credentialSubject[0].recognizedTo.credentialValidator.id =
            'schema.json';
        }));
        await refuses('3.5 (4): validator type JsonSchema', listWith(doc => {
          doc.credentialSubject[0].recognizedTo.credentialValidator.type =
            'JsonSchema';
        }));
        await refuses('3.5 (5): delete validator mediaType', listWith(doc => {
          delete doc.credentialSubject[0].recognizedTo.credentialValidator
            .mediaType;
        }));
        expect(failures, 'checks that failed').to.deep.equal([]);
      });
    });
  }
});
