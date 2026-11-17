#!/usr/bin/env node
/*
 * SPDX-License-Identifier: LicenseRef-w3c-3-clause-bsd-license-2008 OR LicenseRef-w3c-test-suite-license-2023
 */

// Writes the shape-rule fixtures under tests/fixtures/recognized-entities/.
// One conforming base credential, plus one violation per rule in CHECKS. Each
// violation changes exactly one field of the base. Fixtures are unsigned: the
// shape checks do not verify proofs. Signed verifier fixtures are written by
// sign-fixtures.mjs.

export const base = {
  '@context': [
    'https://www.w3.org/ns/credentials/v2',
    'https://www.w3.org/ns/credentials/examples/v2'
  ],
  type: ['VerifiableCredential', 'RecognizedEntityCredential'],
  issuer: {
    id: 'did:example:anchor',
    type: 'RecognizedIssuer',
    name: 'Test Anchor',
    legalName: {'@value': 'Test Anchor Legal Name LLC', '@language': 'en'},
    image: 'data:image/png;base64,iVBORw0KGgo=',
    url: 'https://anchor.example/',
    sameAs: ['https://anchor.example/entities/test-anchor'],
    recognizedIn: {
      id: 'https://anchor.example/lists/recognized-issuers.json',
      type: 'RecognizedEntityCredential'
    }
  },
  validFrom: '2025-01-01T00:00:00Z',
  credentialSubject: [{
    id: 'did:example:issuer',
    type: 'RecognizedEntity',
    name: 'Test Issuer',
    recognizedTo: {
      type: 'RecognizedAction',
      action: 'issue',
      recognizedBy: 'did:example:anchor',
      validFrom: '2025-01-01T00:00:00Z',
      credentialValidator: {
        type: 'CredentialValidator',
        id: 'https://anchor.example/schemas/credential.json',
        mediaType: 'application/schema+json'
      }
    }
  }]
};

// Each entry: the CHECKS key it breaks, and a function that changes one field.
// A UTC-style date-time, 30 days from now, with the given zone suffix. The
// date is set when the fixture is built, so it is never stale.
export function runtimeDateTime(suffix = 'Z') {
  const later = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  return later.toISOString().slice(0, 19) + suffix;
}

// Violations of the recognizedIn rules, applied to the credential under test
// rather than to a list. The positive checks the same object, so the negative
// and positive cover one thing.
export const credentialViolations = {
  '3-2-recognizedentity-2': c => {
    c.issuer.recognizedIn.id = 'not a url';
  },
  '3-2-recognizedentity-3': c => {
    c.issuer.recognizedIn.type = 42;
  }
};

export const violations = {
  '3-1-general-properties-2': c => {
    delete c.issuer.type;
  },
  '3-1-general-properties-3': c => {
    c.issuer.legalName = 42;
  },
  '3-1-general-properties-4': c => {
    c.issuer.image = 'not a url';
  },
  '3-1-general-properties-5': c => {
    c.issuer.url = 'not a url';
  },
  '3-1-general-properties-6': c => {
    c.issuer.sameAs = ['not a url'];
  },
  '3-2-recognizedentity-1': c => {
    c.credentialSubject[0].type = 'RecognizedIssuer';
  },
  '3-2-recognizedentity-2': c => {
    c.issuer.recognizedIn.id = 'not a url';
  },
  '3-2-recognizedentity-3': c => {
    c.issuer.recognizedIn.type = 42;
  },
  // A list that does not conform to section 3.2 as a whole. This is the 3.2
  // entity rule itself, not the action rule that 3-3-1 tests.
  '3-2-recognizedentity-5': c => {
    c.credentialSubject[0].type = 'RecognizedIssuer';
  },
  '3-3-recognizedaction-1': c => {
    c.credentialSubject[0].recognizedTo.type = 'RecognizedEntity';
  },
  // credentialValidator is not required, but when present it holds one or
  // more validators. An empty array holds none.
  '3-3-recognizedaction-2': c => {
    c.credentialSubject[0].recognizedTo.credentialValidator = [];
  },
  '3-3-recognizedaction-4': c => {
    c.credentialSubject[0].recognizedTo.validFrom =
      '2025-01-01T00:00:00.500Z';
  },
  '3-3-recognizedaction-6': c => {
    // The date is set at run time, so no fixture carries a fixed validUntil.
    c.credentialSubject[0].recognizedTo.validUntil =
      runtimeDateTime('+01:00');
  },
  '3-4-recognizedentitycredential-1': c => {
    delete c.issuer;
  },
  '3-4-recognizedentitycredential-3': c => {
    c.type = ['VerifiableCredential'];
  },
  '3-5-credential-validators-1': c => {
    delete c.credentialSubject[0].recognizedTo.credentialValidator.id;
  },
  '3-5-credential-validators-2': c => {
    c.credentialSubject[0].recognizedTo.credentialValidator.id = 'schema.json';
  },
  '3-5-credential-validators-4': c => {
    c.credentialSubject[0].recognizedTo.credentialValidator.type = 'JsonSchema';
  },
  '3-5-credential-validators-5': c => {
    delete c.credentialSubject[0].recognizedTo.credentialValidator.mediaType;
  }
};

// Only the conforming document is written. The violations are built in memory
// from `base` and `violations`, so no violation file goes stale.
// Nothing is written: `base` and `violations` are used in memory by the tests.
export function main() {
  console.log('make-fixtures builds in memory; no files written');
}

if(process.argv[1] && import.meta.url === `file://${process.argv[1]}`) {
  main();
}
