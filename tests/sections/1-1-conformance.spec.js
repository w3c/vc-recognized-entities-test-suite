/*
 * SPDX-License-Identifier: LicenseRef-w3c-3-clause-bsd-license-2008 OR LicenseRef-w3c-test-suite-license-2023
 */

// Hand-written: scripts/scaffold-tests.mjs does not regenerate this file.
//
// Each statement is one test per implementation. Its checks run in order, and
// their failures are collected, so the test fails once with all of them.
//
// 1.1 (2) participates in the verifier's exchange (VCALM, Participate in an
// Exchange): the conforming presentation must get 200, and each presentation
// with one section 3 rule broken must get 400 (Invalid input).

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
const {match} = filterByTag({tags: [tag], property: 'verifiers'});
// The verifier exchange of each implementation: the verifierExchange field on
// its verifier entry.
const verifierExchangeOf = name => match.get(name).settings.verifiers
  .find(v => v.verifierExchange)?.verifierExchange;

describe('1.1 Conformance', function() {
  setupStatementMatrix(this, match.keys());

  for(const name of match.keys()) {
    describe(name, function() {
      it(`${NORMATIVE['1-1-conformance-2']}`, async function() {
        this.test.cell = {columnId: name, rowId: '1-1-conformance-2',
          statement: NORMATIVE['1-1-conformance-2']};
        this.test.link = LINK['1-1-conformance-2'];
        recordRow('1-1-conformance-2', NORMATIVE['1-1-conformance-2']);
        const exchange = verifierExchangeOf(name);
        if(!exchange) {
          this.test.cell.skipMessage = 'no verifier exchange configured';
          this.skip();
        }
        const failures = [];
        await attempt(
          failures,
          'the conforming presentation is accepted',
          async () => {
            const reply = await participate(exchange, [
              await knownIssuerCredential(),
              await anchorListWith(() => {}),
            ]);
            expect(reply.status, 'the conforming presentation').to.equal(200);
          });
        await attempt(
          failures,
          '3.1 (2): delete issuer type',
          async () => {
            const reply =
              await participate(exchange, [await knownIssuerCredential(),
                await anchorListWith(doc => {
                  delete doc.issuer.type;
                }),
              ]);
            expect(reply.status, '3.1 (2)').to.equal(400);
          });
        await attempt(
          failures,
          '3.1 (3): issuer legalName = 42',
          async () => {
            const reply =
              await participate(exchange, [await knownIssuerCredential(),
                await anchorListWith(doc => {
                  doc.issuer.legalName = 42;
                }),
              ]);
            expect(reply.status, '3.1 (3)').to.equal(400);
          });
        await attempt(
          failures,
          '3.1 (4): issuer image not a URL',
          async () => {
            const reply =
              await participate(exchange, [await knownIssuerCredential(),
                await anchorListWith(doc => {
                  doc.issuer.image = 'not a url';
                }),
              ]);
            expect(reply.status, '3.1 (4)').to.equal(400);
          });
        await attempt(
          failures,
          '3.1 (5): issuer url not a URL',
          async () => {
            const reply =
              await participate(exchange, [await knownIssuerCredential(),
                await anchorListWith(doc => {
                  doc.issuer.url = 'not a url';
                }),
              ]);
            expect(reply.status, '3.1 (5)').to.equal(400);
          });
        await attempt(
          failures,
          '3.1 (6): issuer sameAs not a URL',
          async () => {
            const reply =
              await participate(exchange, [await knownIssuerCredential(),
                await anchorListWith(doc => {
                  doc.issuer.sameAs = ['not a url'];
                }),
              ]);
            expect(reply.status, '3.1 (6)').to.equal(400);
          });
        await attempt(
          failures,
          '3.2 (1): subject type RecognizedIssuer',
          async () => {
            const reply =
              await participate(exchange, [await knownIssuerCredential(),
                await anchorListWith(doc => {
                  doc.credentialSubject[0].type = 'RecognizedIssuer';
                }),
              ]);
            expect(reply.status, '3.2 (1)').to.equal(400);
          });
        await attempt(
          failures,
          '3.2 (2): recognizedIn.id not a URL',
          async () => {
            const reply = await participate(exchange, [
              await knownCredentialDocument(doc => {
                doc.issuer.recognizedIn.id = 'not a url';
              }),
              await anchorListWith(() => {}),
            ]);
            expect(reply.status, '3.2 (2)').to.equal(400);
          });
        await attempt(
          failures,
          '3.2 (3): recognizedIn.type = 42',
          async () => {
            const reply = await participate(exchange, [
              await knownCredentialDocument(doc => {
                doc.issuer.recognizedIn.type = 42;
              }),
              await anchorListWith(() => {}),
            ]);
            expect(reply.status, '3.2 (3)').to.equal(400);
          });
        await attempt(
          failures,
          '3.2 (5): subject type RecognizedIssuer',
          async () => {
            const reply =
              await participate(exchange, [await knownIssuerCredential(),
                await anchorListWith(doc => {
                  doc.credentialSubject[0].type = 'RecognizedIssuer';
                }),
              ]);
            expect(reply.status, '3.2 (5)').to.equal(400);
          });
        await attempt(
          failures,
          '3.3 (1): recognizedTo.type RecognizedEntity',
          async () => {
            const reply =
              await participate(exchange, [await knownIssuerCredential(),
                await anchorListWith(doc => {
                  doc.credentialSubject[0].recognizedTo.type =
              'RecognizedEntity';
                }),
              ]);
            expect(reply.status, '3.3 (1)').to.equal(400);
          });
        await attempt(
          failures,
          '3.3 (2): credentialValidator = []',
          async () => {
            const reply =
              await participate(exchange, [await knownIssuerCredential(),
                await anchorListWith(doc => {
                  doc.credentialSubject[0].recognizedTo.credentialValidator =
              [];
                }),
              ]);
            expect(reply.status, '3.3 (2)').to.equal(400);
          });
        await attempt(
          failures,
          '3.3 (4): validFrom has milliseconds',
          async () => {
            const reply =
              await participate(exchange, [await knownIssuerCredential(),
                await anchorListWith(doc => {
                  doc.credentialSubject[0].recognizedTo.validFrom =
                  '2025-01-01T00:00:00.500Z';
                }),
              ]);
            expect(reply.status, '3.3 (4)').to.equal(400);
          });
        await attempt(
          failures,
          '3.3 (6): validUntil 30 days from now',
          async () => {
            const reply =
              await participate(exchange, [await knownIssuerCredential(),
                await anchorListWith(doc => {
                  doc.credentialSubject[0].recognizedTo.validUntil =
                  runtimeDateTime('+01:00');
                }),
              ]);
            expect(reply.status, '3.3 (6)').to.equal(400);
          });
        await attempt(
          failures,
          '3.4 (1): delete the issuer',
          async () => {
            const reply =
              await participate(exchange, [await knownIssuerCredential(),
                await anchorListWith(doc => {
                  delete doc.issuer;
                }),
              ]);
            expect(reply.status, '3.4 (1)').to.equal(400);
          });
        await attempt(
          failures,
          '3.4 (3): type without RecognizedEntityCredential',
          async () => {
            const reply =
              await participate(exchange, [await knownIssuerCredential(),
                await anchorListWith(doc => {
                  doc.type = ['VerifiableCredential'];
                }),
              ]);
            expect(reply.status, '3.4 (3)').to.equal(400);
          });
        await attempt(
          failures,
          '3.5 (1): delete validator id',
          async () => {
            const reply =
              await participate(exchange, [await knownIssuerCredential(),
                await anchorListWith(doc => {
                  delete doc.credentialSubject[0].recognizedTo
                    .credentialValidator.id;
                }),
              ]);
            expect(reply.status, '3.5 (1)').to.equal(400);
          });
        await attempt(
          failures,
          '3.5 (2): validator id = schema.json',
          async () => {
            const reply =
              await participate(exchange, [await knownIssuerCredential(),
                await anchorListWith(doc => {
                  doc.credentialSubject[0].recognizedTo.credentialValidator.id =
                  'schema.json';
                }),
              ]);
            expect(reply.status, '3.5 (2)').to.equal(400);
          });
        await attempt(
          failures,
          '3.5 (4): validator type JsonSchema',
          async () => {
            const reply =
              await participate(exchange, [await knownIssuerCredential(),
                await anchorListWith(doc => {
                  doc.credentialSubject[0].recognizedTo
                    .credentialValidator.type =
                  'JsonSchema';
                }),
              ]);
            expect(reply.status, '3.5 (4)').to.equal(400);
          });
        await attempt(
          failures,
          '3.5 (5): delete validator mediaType',
          async () => {
            const reply =
              await participate(exchange, [await knownIssuerCredential(),
                await anchorListWith(doc => {
                  delete doc.credentialSubject[0].recognizedTo
                    .credentialValidator.mediaType;
                }),
              ]);
            expect(reply.status, '3.5 (5)').to.equal(400);
          });
        expect(failures, 'checks that failed').to.deep.equal([]);
      });
    });
  }
});
