/*
 * SPDX-License-Identifier: LicenseRef-w3c-3-clause-bsd-license-2008 OR LicenseRef-w3c-test-suite-license-2023
 */

// Issuers for the identifier-based discovery rows (section 4.2). Each issuer
// is a did:web identifier under whois.example. Its controlled identifier
// document, and the presentation at its WhoisService endpoint, are in
// fixtures/recognized-entities/signed/identifier-registry.json, which
// scripts/sign-identifier-fixtures.mjs writes. The names are never looked up
// on the network: a verifier under test resolves them from that file.

import {
  CREDENTIALS_V2, DATA_INTEGRITY_CONTEXT, keyFromLabel, sign, TEST_CONTEXT_URL
} from './signing.js';

export const WHOIS_HOST = 'whois.example';

// Every issuer the registry describes, by short name.
export const WHOIS_ISSUERS = [
  // WhoisService and PathService; the anchor recognizes the issuer.
  'accepted',
  // As accepted, but the list is from an issuer the verifier does not
  // recognize, with no recognizedIn.
  'unknown-recognizer',
  // The only service has type WhoisService (no PathService).
  'whois-only',
  // The only service has type PathService (no WhoisService).
  'path-only',
  // The endpoint serves nothing.
  'unserved',
  // The endpoint is a loopback address. The registry serves a presentation
  // there, so only a retrieval policy stops it.
  'loopback',
  // The presentation was changed after it was signed.
  'tampered',
  // The presentation verifies, but with the key of another identifier.
  'wrong-signer',
  // The anchor's list in the presentation names another entity.
  'other-entity',
  // Two lists: an unknown recognizer's first, then the anchor's.
  'two-lists',
  // A list from an intermediate whose issuer object has recognizedIn.
  'via-intermediate',
  // The same intermediate's list, without recognizedIn.
  'intermediate-no-recognized-in'
];

export const whoisId = name => `did:web:${WHOIS_HOST}:issuers:${name}`;
export const whoisEndpoint = name =>
  `https://${WHOIS_HOST}/issuers/${name}/whois.vp`;
export const LOOPBACK_ENDPOINT = 'https://127.0.0.1/issuers/loopback/whois.vp';
// The anchor's list that recognizes the intermediate. The holder staples it.
export const INTERMEDIATE_ANCHOR_LIST =
  'https://anchor.example/lists/whois-intermediate.json';

// The Ed25519 key of a whois issuer. The key comes from a public label, as in
// signing.js, but its id is a fragment of the did:web identifier.
export async function whoisKey(name) {
  const {key} = await keyFromLabel(`vc-recognized-entities whois ${name}`);
  const did = whoisId(name);
  key.id = `${did}#key-1`;
  key.controller = did;
  return {did, key};
}

// A credential issued by the named whois issuer. Its issuer object has no
// recognizedIn, so only identifier-based discovery can find a list for it.
export async function whoisCredential(name) {
  return sign({
    '@context': [CREDENTIALS_V2, DATA_INTEGRITY_CONTEXT, TEST_CONTEXT_URL],
    type: ['VerifiableCredential', 'ExampleCredential'],
    issuer: {id: whoisId(name)},
    validFrom: '2025-06-01T00:00:00Z',
    credentialSubject: {id: 'urn:example:subject', name: 'Test Subject'}
  }, await whoisKey(name));
}
