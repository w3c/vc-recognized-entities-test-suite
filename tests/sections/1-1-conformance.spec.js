/*
 * SPDX-License-Identifier: LicenseRef-w3c-3-clause-bsd-license-2008 OR LicenseRef-w3c-test-suite-license-2023
 */

// Hand-written: scripts/scaffold-tests.mjs does not regenerate this file.
//
// Each statement is one test per implementation. Its checks run in order, and
// their failures are collected, so the test fails once with all of them.

import {
  acceptsConforming, setupStatementMatrix, verifyOn
} from '../statement-suite.js';
import {
  anchorListWith, attempt, knownIssuerCredential
} from '../helpers.js';
import {describe, it} from 'mocha';
import {expect} from 'chai';
import {filterByTag} from 'vc-test-suite-implementations';
import {knownCredentialDocument} from '../chains.js';
import {NORMATIVE} from '../normative-statements.js';
import {runtimeDateTime} from '../../scripts/make-fixtures.mjs';

// Verifiers tagged for this suite. Each one gets its own describe below.
const tag = 'recognized-entities';
const {match} = filterByTag({tags: [tag], property: 'verifiers'});

// Skipped for now: this section is not run on this branch.
describe.skip('1.1 Conformance', function() {
  setupStatementMatrix(this);

  for(const name of match.keys()) {
    describe(name, function() {
      it(`[MUST] ${NORMATIVE['1-1-conformance-2']}`, async function() {
        this.test.cell = {columnId: name, rowId: '1-1-conformance-2',
          statement: NORMATIVE['1-1-conformance-2']};
        const failures = [];
        await attempt(
          failures,
          'the conforming credential produces no errors',
          async () => {
            await acceptsConforming(name);
          });
        await attempt(
          failures,
          '3.1 (2): delete issuer type',
          async () => {
            const outcome =
              await verifyOn(name, [await knownIssuerCredential(),
                await anchorListWith(doc => {
                  delete doc.issuer.type;
                }),
              ]);
            expect(outcome.errors, '3.1 (2): errors').to.not.be.empty;
          });
        await attempt(
          failures,
          '3.1 (3): issuer legalName = 42',
          async () => {
            const outcome =
              await verifyOn(name, [await knownIssuerCredential(),
                await anchorListWith(doc => {
                  doc.issuer.legalName = 42;
                }),
              ]);
            expect(outcome.errors, '3.1 (3): errors').to.not.be.empty;
          });
        await attempt(
          failures,
          '3.1 (4): issuer image not a URL',
          async () => {
            const outcome =
              await verifyOn(name, [await knownIssuerCredential(),
                await anchorListWith(doc => {
                  doc.issuer.image = 'not a url';
                }),
              ]);
            expect(outcome.errors, '3.1 (4): errors').to.not.be.empty;
          });
        await attempt(
          failures,
          '3.1 (5): issuer url not a URL',
          async () => {
            const outcome =
              await verifyOn(name, [await knownIssuerCredential(),
                await anchorListWith(doc => {
                  doc.issuer.url = 'not a url';
                }),
              ]);
            expect(outcome.errors, '3.1 (5): errors').to.not.be.empty;
          });
        await attempt(
          failures,
          '3.1 (6): issuer sameAs not a URL',
          async () => {
            const outcome =
              await verifyOn(name, [await knownIssuerCredential(),
                await anchorListWith(doc => {
                  doc.issuer.sameAs = ['not a url'];
                }),
              ]);
            expect(outcome.errors, '3.1 (6): errors').to.not.be.empty;
          });
        await attempt(
          failures,
          '3.2 (1): subject type RecognizedIssuer',
          async () => {
            const outcome =
              await verifyOn(name, [await knownIssuerCredential(),
                await anchorListWith(doc => {
                  doc.credentialSubject[0].type = 'RecognizedIssuer';
                }),
              ]);
            expect(outcome.errors, '3.2 (1): errors').to.not.be.empty;
          });
        await attempt(
          failures,
          '3.2 (2): recognizedIn.id not a URL',
          async () => {
            const outcome = await verifyOn(name, [
              await knownCredentialDocument(doc => {
                doc.issuer.recognizedIn.id = 'not a url';
              }),
              await anchorListWith(() => {}),
            ]);
            expect(outcome.errors, '3.2 (2): errors').to.not.be.empty;
          });
        await attempt(
          failures,
          '3.2 (3): recognizedIn.type = 42',
          async () => {
            const outcome = await verifyOn(name, [
              await knownCredentialDocument(doc => {
                doc.issuer.recognizedIn.type = 42;
              }),
              await anchorListWith(() => {}),
            ]);
            expect(outcome.errors, '3.2 (3): errors').to.not.be.empty;
          });
        await attempt(
          failures,
          '3.2 (5): subject type RecognizedIssuer',
          async () => {
            const outcome =
              await verifyOn(name, [await knownIssuerCredential(),
                await anchorListWith(doc => {
                  doc.credentialSubject[0].type = 'RecognizedIssuer';
                }),
              ]);
            expect(outcome.errors, '3.2 (5): errors').to.not.be.empty;
          });
        await attempt(
          failures,
          '3.3 (1): recognizedTo.type RecognizedEntity',
          async () => {
            const outcome =
              await verifyOn(name, [await knownIssuerCredential(),
                await anchorListWith(doc => {
                  doc.credentialSubject[0].recognizedTo.type =
              'RecognizedEntity';
                }),
              ]);
            expect(outcome.errors, '3.3 (1): errors').to.not.be.empty;
          });
        await attempt(
          failures,
          '3.3 (2): credentialValidator = []',
          async () => {
            const outcome =
              await verifyOn(name, [await knownIssuerCredential(),
                await anchorListWith(doc => {
                  doc.credentialSubject[0].recognizedTo.credentialValidator =
              [];
                }),
              ]);
            expect(outcome.errors, '3.3 (2): errors').to.not.be.empty;
          });
        await attempt(
          failures,
          '3.3 (4): validFrom has milliseconds',
          async () => {
            const outcome =
              await verifyOn(name, [await knownIssuerCredential(),
                await anchorListWith(doc => {
                  doc.credentialSubject[0].recognizedTo.validFrom =
                  '2025-01-01T00:00:00.500Z';
                }),
              ]);
            expect(outcome.errors, '3.3 (4): errors').to.not.be.empty;
          });
        await attempt(
          failures,
          '3.3 (6): validUntil 30 days from now',
          async () => {
            const outcome =
              await verifyOn(name, [await knownIssuerCredential(),
                await anchorListWith(doc => {
                  doc.credentialSubject[0].recognizedTo.validUntil =
                  runtimeDateTime('+01:00');
                }),
              ]);
            expect(outcome.errors, '3.3 (6): errors').to.not.be.empty;
          });
        await attempt(
          failures,
          '3.4 (1): delete the issuer',
          async () => {
            const outcome =
              await verifyOn(name, [await knownIssuerCredential(),
                await anchorListWith(doc => {
                  delete doc.issuer;
                }),
              ]);
            expect(outcome.errors, '3.4 (1): errors').to.not.be.empty;
          });
        await attempt(
          failures,
          '3.4 (3): type without RecognizedEntityCredential',
          async () => {
            const outcome =
              await verifyOn(name, [await knownIssuerCredential(),
                await anchorListWith(doc => {
                  doc.type = ['VerifiableCredential'];
                }),
              ]);
            expect(outcome.errors, '3.4 (3): errors').to.not.be.empty;
          });
        await attempt(
          failures,
          '3.5 (1): delete validator id',
          async () => {
            const outcome =
              await verifyOn(name, [await knownIssuerCredential(),
                await anchorListWith(doc => {
                  delete doc.credentialSubject[0].recognizedTo
                    .credentialValidator.id;
                }),
              ]);
            expect(outcome.errors, '3.5 (1): errors').to.not.be.empty;
          });
        await attempt(
          failures,
          '3.5 (2): validator id = schema.json',
          async () => {
            const outcome =
              await verifyOn(name, [await knownIssuerCredential(),
                await anchorListWith(doc => {
                  doc.credentialSubject[0].recognizedTo.credentialValidator.id =
                  'schema.json';
                }),
              ]);
            expect(outcome.errors, '3.5 (2): errors').to.not.be.empty;
          });
        await attempt(
          failures,
          '3.5 (4): validator type JsonSchema',
          async () => {
            const outcome =
              await verifyOn(name, [await knownIssuerCredential(),
                await anchorListWith(doc => {
                  doc.credentialSubject[0].recognizedTo
                    .credentialValidator.type =
                  'JsonSchema';
                }),
              ]);
            expect(outcome.errors, '3.5 (4): errors').to.not.be.empty;
          });
        await attempt(
          failures,
          '3.5 (5): delete validator mediaType',
          async () => {
            const outcome =
              await verifyOn(name, [await knownIssuerCredential(),
                await anchorListWith(doc => {
                  delete doc.credentialSubject[0].recognizedTo
                    .credentialValidator.mediaType;
                }),
              ]);
            expect(outcome.errors, '3.5 (5): errors').to.not.be.empty;
          });
        expect(failures, 'checks that failed').to.deep.equal([]);
      });
    });
  }
});
