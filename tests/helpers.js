/*
 * SPDX-License-Identifier: LicenseRef-w3c-3-clause-bsd-license-2008 OR LicenseRef-w3c-test-suite-license-2023
 */

// Helpers for the section files: the report matrix, the exchange request, and
// the documents the tests send.

import {
  CREDENTIALS_V2, EXAMPLES_CONTEXT_URL, keyFromLabel, sign, signPresentation
} from './signing.js';
import {expect} from 'chai';
import {it} from 'mocha';
import {LINK} from './normative-links.js';
import {NORMATIVE} from './normative-statements.js';
import {randomUUID} from 'node:crypto';
import {readFile} from 'node:fs/promises';

const ANCHOR_LIST_URL =
  'https://anchor.example/credentials/recognized-issuers.json';
const CONTEXT = [CREDENTIALS_V2, EXAMPLES_CONTEXT_URL];

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

// POSTs {verifiablePresentation} with the given credentials to the exchange
// URL, and returns the HTTP status. The body has the shape of a VCALM
// Participate in an Exchange request; no other exchange step is used. The test
// holder signs the presentation for authentication, with a fresh challenge and
// the exchange's origin as domain.
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

// Statement tests ----------------------------------------------------------

// One test for one statement and one implementation. It fills the report
// cell, skips when the verifier has no exchange, and runs `checks` with the
// accepts and refuses checks for that exchange. Each check sends the
// presentation that `documents` builds, and expects 200 (accepts) or 400
// (refuses). A failed check is recorded under its label and the next one
// runs, so the test fails once, with every failed check.
export function statementTest({name, exchange, rowId}, checks) {
  it(NORMATIVE[rowId], async function() {
    this.test.cell = {columnId: name, rowId, statement: NORMATIVE[rowId]};
    this.test.link = LINK[rowId];
    recordRow(rowId, NORMATIVE[rowId]);
    if(!exchange) {
      this.test.cell.skipMessage = 'no verifier exchange configured';
      this.skip();
    }
    const failures = [];
    const sends = (label, status, documents) => attempt(
      failures, label, async () => {
        const reply = await participate(exchange, await documents());
        expect(reply.status).to.equal(status);
      });
    await checks({
      accepts: (label, documents) => sends(label, 200, documents),
      refuses: (label, documents) => sends(label, 400, documents)
    });
    expect(failures, 'checks that failed').to.deep.equal([]);
  });
}

// Documents ----------------------------------------------------------------

// The credentials of a presentation: the known issuer credential and the
// anchor's list, with `change` applied to the list.
export function listWith(change = () => {}) {
  return async () =>
    [await knownIssuerCredential(), await anchorListWith(change)];
}

// The same, with `change` applied to the credential instead.
export function credentialWith(change) {
  return async () =>
    [await knownCredentialDocument(change), await anchorListWith()];
}

// The same, with the anchor's list using a JavaScript credential validator
// whose validator code is `code`.
export function listWithValidator(code) {
  return listWith(doc => {
    doc.credentialSubject[0].recognizedTo.credentialValidator =
      javascriptValidator(code);
  });
}

// A JavaScript credential validator (4.4.1) with the validator code `code`,
// embedded as a data: URL.
export function javascriptValidator(code) {
  return {
    type: 'CredentialValidator',
    id: 'data:text/javascript,' + encodeURIComponent(code),
    mediaType: 'text/javascript'
  };
}

// Validator code that conforms to 4.4 and 4.4.1.1: it throws an
// UNRECOGNIZED_OPTION_ERROR for an option it does not know, and otherwise
// finds the credential valid.
export const CONFORMING_VALIDATOR_CODE = `
export default function validate(credential, options) {
  const known = ['chain', 'action', 'evaluationDateTime'];
  for(const name of Object.keys(options)) {
    if(!known.includes(name)) {
      const error = new Error('Unrecognized option "' + name + '".');
      error.type =
        'https://www.w3.org/TR/vc-data-model#UNRECOGNIZED_OPTION_ERROR';
      throw error;
    }
  }
  return {valid: true, errors: [], warnings: []};
}
`;

// The credential validator in the anchor's list `doc`.
export function validatorOf(doc) {
  return doc.credentialSubject[0].recognizedTo.credentialValidator;
}

// A credential validator that the known issuer credential does not satisfy:
// its schema requires a property the credential does not have.
export const unsatisfiedValidator = {
  type: 'CredentialValidator',
  id: 'data:application/schema+json,' + encodeURIComponent(JSON.stringify({
    type: 'object', required: ['notInTheCredential']
  })),
  mediaType: 'application/schema+json'
};

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
