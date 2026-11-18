/*
 * SPDX-License-Identifier: LicenseRef-w3c-3-clause-bsd-license-2008 OR LicenseRef-w3c-test-suite-license-2023
 */

// Helpers for the section files: the report matrix, the exchange request, and
// the documents the tests send.

import {
  CREDENTIALS_V2, DATA_INTEGRITY_CONTEXT, keyFromLabel, sign, signPresentation,
  TEST_CONTEXT_URL
} from './signing.js';
import {randomUUID} from 'node:crypto';
import {readFile} from 'node:fs/promises';

const ANCHOR_LIST_URL =
  'https://anchor.example/credentials/recognized-issuers.json';
const CONTEXT = [CREDENTIALS_V2, DATA_INTEGRITY_CONTEXT, TEST_CONTEXT_URL];

const anchorKey = () => keyFromLabel('vc-recognized-entities test anchor');
const issuerKey = () => keyFromLabel('vc-recognized-entities test issuer');
const holderKey = () => keyFromLabel('vc-recognized-entities test holder');

// Report matrix ------------------------------------------------------------

// Marks a section describe as a report matrix, with one column per
// implementation name. Call it as `setupStatementMatrix(this, names)`.
export function setupStatementMatrix(suite, names) {
  suite.report = true;
  suite.matrix = true;
  suite.implemented = [...names];
  suite.notImplemented = [];
  suite.rowLabel = 'Normative statement';
  suite.columnLabel = 'Implementation';
}

// Records a row's statement text for the report. At-risk rows lose their
// cells, so the report reads their text from this registry.
export function recordRow(rowId, statement) {
  globalThis.interopRowText ??= {};
  globalThis.interopRowText[rowId] = statement;
}

// Runs one check. A failure is recorded in failures, not thrown, so the other
// checks in the same test still run. The test fails once, after all checks.
export async function attempt(failures, label, run) {
  try {
    await run();
  } catch(error) {
    failures.push(`${label}: ${error.message}`);
  }
}

// Exchange -----------------------------------------------------------------

// Participates in an exchange (VCALM, Participate in an Exchange): POSTs
// {verifiablePresentation} with the given credentials to the exchange URL,
// and returns the HTTP status. The test holder signs the presentation for
// authentication, with a fresh challenge and the exchange's origin as domain.
export async function participate(exchange, credentials) {
  const holder = await holderKey();
  const verifiablePresentation = await signPresentation({
    '@context': [CREDENTIALS_V2],
    type: ['VerifiablePresentation'],
    holder: holder.did,
    verifiableCredential: credentials
  }, holder, {challenge: randomUUID(), domain: new URL(exchange).origin});
  const response = await fetch(exchange, {
    method: 'POST',
    headers: {'content-type': 'application/json'},
    body: JSON.stringify({verifiablePresentation})
  });
  return {status: response.status};
}

// Documents ----------------------------------------------------------------

// The known issuer credential: a credential from the recognized test issuer,
// from the signed fixtures.
export async function knownIssuerCredential() {
  return JSON.parse(await readFile(new URL(
    './fixtures/recognized-entities/signed/known-issuer-credential.json',
    import.meta.url), 'utf8'));
}

// The known issuer credential built at run time, with one change applied
// before the test issuer signs it.
export async function knownCredentialDocument(change = () => {}) {
  const issuer = await issuerKey();
  const document = {
    '@context': CONTEXT,
    type: ['VerifiableCredential', 'ExampleCredential'],
    issuer: {id: issuer.did, recognizedIn: {
      id: ANCHOR_LIST_URL, type: 'RecognizedEntityCredential'
    }},
    validFrom: '2025-06-01T00:00:00Z',
    credentialSubject: {id: 'urn:example:subject', name: 'Test Subject'}
  };
  change(document);
  return sign(document, issuer);
}

// The anchor's recognized list for the test issuer, with one change applied
// before the anchor signs it. Its validator accepts any credential that has a
// credentialSubject, so a refusal comes from the change, not the validator.
export async function anchorListWith(change = () => {}) {
  const anchor = await anchorKey();
  const issuer = await issuerKey();
  const schema = {type: 'object', required: ['credentialSubject']};
  const doc = {
    '@context': CONTEXT,
    id: ANCHOR_LIST_URL,
    type: ['VerifiableCredential', 'RecognizedEntityCredential'],
    issuer: {
      id: anchor.did,
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
      id: issuer.did,
      type: 'RecognizedEntity',
      name: 'Test Issuer',
      recognizedTo: {
        type: 'RecognizedAction',
        action: 'issue',
        recognizedBy: anchor.did,
        validFrom: '2025-01-01T00:00:00Z',
        credentialValidator: {
          type: 'CredentialValidator',
          id: 'data:application/schema+json,' +
            encodeURIComponent(JSON.stringify(schema)),
          mediaType: 'application/schema+json'
        }
      }
    }]
  };
  change(doc);
  return sign(doc, anchor);
}

// A date and time 30 days from now, with the given zone suffix.
export function runtimeDateTime(suffix = 'Z') {
  const later = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  return later.toISOString().slice(0, 19) + suffix;
}
