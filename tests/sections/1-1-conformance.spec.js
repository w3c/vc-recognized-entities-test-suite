/*
 * SPDX-License-Identifier: LicenseRef-w3c-3-clause-bsd-license-2008 OR LicenseRef-w3c-test-suite-license-2023
 */

// Each statement is one test per implementation (see statementTest in
// ../helpers.js). The test sends signed presentations to the verifier's
// exchange (see the README, "The exchange endpoint"): the conforming
// presentation must be accepted (200), and each presentation that breaks a
// rule must be refused (400).
//
// 1.1 (2) refuses one presentation for each section 3 rule.

import {
  credentialWith, listWith, runtimeDateTime, setupStatementMatrix,
  statementTest, unsatisfiedValidator, validatorOf
} from '../helpers.js';
import {describe} from 'mocha';
import {filterByTag} from 'vc-test-suite-implementations';

// Verifiers tagged for this suite. Each one gets its own describe below.
const tag = 'recognized-entities';
const {match: verifierImplementations} = filterByTag(
  {tags: [tag], property: 'verifiers'});

describe('1.1 Conformance', function() {
  setupStatementMatrix(this, verifierImplementations.keys());

  for(const name of verifierImplementations.keys()) {
    // The exchange field on this implementation's tagged verifier entry.
    // Without it, the tests are skipped.
    const exchange = verifierImplementations.get(name).settings.verifiers
      .find(v => v.tags?.includes(tag))?.exchange;
    describe(name, function() {
      statementTest({
        name, exchange, rowId: '1-1-conformance-2'
      }, async ({accepts, refuses}) => {
        await accepts('the conforming presentation', listWith());
        await refuses('3.1 (2): issuer type deleted', listWith(doc => {
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
        await refuses('3.2 (3): recognizedIn.type = 42',
          credentialWith(doc => {
            doc.issuer.recognizedIn.type = 42;
          }));
        await refuses('3.2 (5): subject type RecognizedIssuer',
          listWith(doc => {
            doc.credentialSubject[0].type = 'RecognizedIssuer';
          }));
        await refuses('3.3 (1): recognizedTo.type RecognizedEntity',
          listWith(doc => {
            doc.credentialSubject[0].recognizedTo.type = 'RecognizedEntity';
          }));
        await refuses('3.3 (2): credentialValidator = []', listWith(doc => {
          doc.credentialSubject[0].recognizedTo.credentialValidator = [];
        }));
        await refuses('3.3 (3): second validator not satisfied',
          listWith(doc => {
            const action = doc.credentialSubject[0].recognizedTo;
            action.credentialValidator =
              [action.credentialValidator, unsatisfiedValidator];
          }));
        await refuses('3.3 (4): validFrom has milliseconds', listWith(doc => {
          doc.credentialSubject[0].recognizedTo.validFrom =
            '2025-01-01T00:00:00.500Z';
        }));
        await refuses('3.3 (6): validUntil not in UTC', listWith(doc => {
          doc.credentialSubject[0].recognizedTo.validUntil =
            runtimeDateTime('+01:00');
        }));
        await refuses('3.4 (1): issuer deleted', listWith(doc => {
          delete doc.issuer;
        }));
        await refuses('3.4 (3): type without RecognizedEntityCredential',
          listWith(doc => {
            doc.type = ['VerifiableCredential'];
          }));
        await refuses('3.5 (1): validator id deleted', listWith(doc => {
          delete validatorOf(doc).id;
        }));
        await refuses('3.5 (2): validator id = schema.json', listWith(doc => {
          validatorOf(doc).id = 'schema.json';
        }));
        await refuses('3.5 (4): validator type JsonSchema', listWith(doc => {
          validatorOf(doc).type = 'JsonSchema';
        }));
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
