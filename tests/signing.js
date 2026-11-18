/*
 * SPDX-License-Identifier: LicenseRef-w3c-3-clause-bsd-license-2008 OR LicenseRef-w3c-test-suite-license-2023
 */

// Shared signing and verification helpers for the suite's signed fixtures.
// Keys come from seeds built from public labels, so the same DIDs come back on
// every run. The DID documents are derived from the DID, so no key store is
// needed. Verification uses the vc library, as verifiers do.

import * as credentialsContext from '@digitalbazaar/credentials-context';
import * as dataIntegrityContext from '@digitalbazaar/data-integrity-context';
import * as Ed25519Multikey from '@digitalbazaar/ed25519-multikey';
import {
  createSignCryptosuite, createVerifyCryptosuite
} from '@digitalbazaar/eddsa-jcs-2022-cryptosuite';
import {createHash} from 'node:crypto';
import {DataIntegrityProof} from '@digitalbazaar/data-integrity';
import jsonldSignatures from 'jsonld-signatures';

const {purposes: {AssertionProofPurpose}} = jsonldSignatures;

export const CREDENTIALS_V2 = 'https://www.w3.org/ns/credentials/v2';
export const DATA_INTEGRITY_CONTEXT = 'https://w3id.org/security/data-integrity/v2';
export const TEST_CONTEXT_URL =
  'https://anchor.example/contexts/recognized-entities-test/v1';
export const TEST_CONTEXT = {
  '@context': {'@vocab': 'https://anchor.example/vocab/'}
};

const toEntries = c => c instanceof Map ? [...c] : Object.entries(c);
const LOCAL = new Map([
  ...toEntries(credentialsContext.contexts),
  ...toEntries(dataIntegrityContext.contexts),
  [TEST_CONTEXT_URL, TEST_CONTEXT]
]);

// The Ed25519 did:key for a public label. A test key only; it has no other use.
export async function keyFromLabel(label) {
  const seed = createHash('sha256').update(label).digest();
  const key = await Ed25519Multikey.generate({seed});
  const did = `did:key:${key.publicKeyMultibase}`;
  key.id = `${did}#${key.publicKeyMultibase}`;
  key.controller = did;
  return {did, key};
}

// The DID document for a did:key, built from the DID itself.
export function didDocumentFor(did) {
  const publicKeyMultibase = did.slice('did:key:'.length);
  const id = `${did}#${publicKeyMultibase}`;
  return {
    '@context': ['https://www.w3.org/ns/did/v1'],
    id: did,
    verificationMethod: [{
      '@context': ['https://w3id.org/security/multikey/v1'],
      id,
      type: 'Multikey',
      controller: did,
      publicKeyMultibase
    }],
    assertionMethod: [id]
  };
}

// Loads contexts from local packages, and did:key documents from their DIDs.
// Never fetches over the network.
export async function documentLoader(url) {
  let document = LOCAL.get(url);
  if(document === undefined && url.startsWith('did:key:')) {
    const [did, fragment] = url.split('#');
    const didDocument = didDocumentFor(did);
    document = fragment === undefined ? didDocument :
      didDocument.verificationMethod.find(method => method.id === url);
  }
  if(document === undefined) {
    throw new Error(`Document not available locally: ${url}`);
  }
  return {contextUrl: null, documentUrl: url, document};
}

// Signs a document with eddsa-jcs-2022.
export async function sign(document, {key}) {
  const suite = new DataIntegrityProof({
    signer: key.signer(), cryptosuite: createSignCryptosuite()
  });
  const proof = await suite.createProof({
    document, purpose: new AssertionProofPurpose(), documentLoader
  });
  return {...document, proof};
}

// The suite list a caller passes to verification.
export function verifierSuites() {
  return [new DataIntegrityProof({cryptosuite: createVerifyCryptosuite()})];
}
