/*
 * SPDX-License-Identifier: LicenseRef-w3c-3-clause-bsd-license-2008 OR LicenseRef-w3c-test-suite-license-2023
 */

// Builds recognition chains at run time, for the 4.3 rows that need chains of
// a given length or shape. Keys come from the same labels as the fixtures, so
// the issuers are the test issuer and the test anchor. Every list passes its
// own validator, so a refusal comes from the chain's shape, not a validator.

import {
  CREDENTIALS_V2, DATA_INTEGRITY_CONTEXT, keyFromLabel, sign, TEST_CONTEXT_URL
} from './signing.js';

const KNOWN_RECOGNIZED_IN =
  'https://anchor.example/credentials/recognized-issuers.json';
const VALIDITY = {
  validFrom: '2025-01-01T00:00:00Z'
};
const PASSING_VALIDATOR = {
  type: 'CredentialValidator',
  id: 'data:application/schema+json,' + encodeURIComponent(
    JSON.stringify({type: 'object', required: ['credentialSubject']})),
  mediaType: 'application/schema+json'
};

const anchorKey = () => keyFromLabel('vc-recognized-entities test anchor');
const issuerKey = () => keyFromLabel('vc-recognized-entities test issuer');

// A list signed by `signer` that recognizes `entityId` for the action "issue",
// with the given credential validators. recognizedIn names the next list in
// the chain, if there is one.
export async function list({
  signer, id, entityId, recognizedIn, validators = [PASSING_VALIDATOR],
  validUntil
}) {
  const issuer = {id: signer.did, type: 'RecognizedIssuer'};
  if(recognizedIn) {
    issuer.recognizedIn = {
      id: recognizedIn, type: 'RecognizedEntityCredential'
    };
  }
  return sign({
    '@context': [CREDENTIALS_V2, DATA_INTEGRITY_CONTEXT, TEST_CONTEXT_URL],
    id,
    type: ['VerifiableCredential', 'RecognizedEntityCredential'],
    issuer,
    validFrom: VALIDITY.validFrom,
    ...(validUntil === undefined ? {} : {validUntil}),
    credentialSubject: [{
      id: entityId,
      type: 'RecognizedEntity',
      name: 'Chain entity',
      recognizedTo: {
        type: 'RecognizedAction',
        action: 'issue',
        recognizedBy: signer.did,
        credentialValidator: validators
      }
    }]
  }, signer);
}

// The known issuer's credential, re-signed here so the chain is self-contained.
// `validUntil`, when given, ends the credential's own validity period.
export async function knownCredential({validUntil} = {}) {
  const issuer = await issuerKey();
  const anchor = await anchorKey();
  return sign({
    '@context': [CREDENTIALS_V2, DATA_INTEGRITY_CONTEXT, TEST_CONTEXT_URL],
    type: ['VerifiableCredential', 'ExampleCredential'],
    issuer: {id: issuer.did, recognizedIn: {
      id: KNOWN_RECOGNIZED_IN, type: 'RecognizedEntityCredential'
    }},
    validFrom: '2025-06-01T00:00:00Z',
    ...(validUntil === undefined ? {} : {validUntil}),
    credentialSubject: {id: 'urn:example:subject', name: 'Test Subject'}
  }, issuer).then(credential => ({credential, anchor}));
}

/**
 * A chain of the known credential and one anchor list whose only recognized
 * action carries the given credential validators.
 *
 * @param {object[]} validators - The validators the list declares.
 * @returns {Promise<object[]>} The credentials, starting with the known one.
 */
export async function chainWithValidators(validators) {
  const {credential: known, anchor} = await knownCredential();
  const issuer = await issuerKey();
  return [known, await list({
    signer: anchor, id: KNOWN_RECOGNIZED_IN, entityId: issuer.did, validators
  })];
}

// The known issuer's credential under test, built in memory and changed by
// `mutate` before it is signed. Used by the negatives that must break the
// credential under test itself, the same object the positive checks.
export async function knownCredentialDocument(mutate = () => {}) {
  const issuer = await issuerKey();
  const document = {
    '@context': [CREDENTIALS_V2, DATA_INTEGRITY_CONTEXT, TEST_CONTEXT_URL],
    type: ['VerifiableCredential', 'ExampleCredential'],
    issuer: {id: issuer.did, recognizedIn: {
      id: KNOWN_RECOGNIZED_IN, type: 'RecognizedEntityCredential'
    }},
    validFrom: '2025-06-01T00:00:00Z',
    credentialSubject: {id: 'urn:example:subject', name: 'Test Subject'}
  };
  mutate(document);
  return sign(document, issuer);
}
