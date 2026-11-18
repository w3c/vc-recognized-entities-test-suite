/*
 * SPDX-License-Identifier: LicenseRef-w3c-3-clause-bsd-license-2008 OR LicenseRef-w3c-test-suite-license-2023
 */

// Shared helpers for the section files and the fixture builder.

import * as makeFixtures from '../scripts/make-fixtures.mjs';
import {
  CREDENTIALS_V2, DATA_INTEGRITY_CONTEXT, keyFromLabel, sign, TEST_CONTEXT_URL
} from './signing.js';
import {expect} from 'chai';
import {readFile} from 'node:fs/promises';

// Runs one check. A failure is recorded in failures, not thrown, so the other
// checks in the same test still run. The test fails once, after all checks.

export async function attempt(failures, label, run) {
  try {
    await run();
  } catch(error) {
    failures.push(`${label}: ${error.message}`);
  }
}

// The known issuer credential, from the signed fixtures.
export async function knownIssuerCredential() {
  return JSON.parse(await readFile(new URL(
    './fixtures/recognized-entities/signed/known-issuer-credential.json',
    import.meta.url), 'utf8'));
}

// The anchor's recognized list for the known issuer. It is built from the base
// credential in scripts/make-fixtures.mjs, with one change applied before the
// anchor signs it. Used by the statement tests and by the fixture builder.

export const ANCHOR_LIST_URL =
  'https://anchor.example/credentials/recognized-issuers.json';
export const LIST_CONTEXT =
  [CREDENTIALS_V2, DATA_INTEGRITY_CONTEXT, TEST_CONTEXT_URL];

// The validator that accepts any credential that has a credentialSubject.
export function acceptingValidator() {
  const schema = {type: 'object', required: ['credentialSubject']};
  return {
    type: 'CredentialValidator',
    id: 'data:application/schema+json,' +
      encodeURIComponent(JSON.stringify(schema)),
    mediaType: 'application/schema+json'
  };
}

// Builds the list, applies `change` to it, and signs it as the anchor.
export async function anchorList({
  anchor, issuer, context = LIST_CONTEXT, passes = acceptingValidator(),
  change = () => {}
}) {
  const doc = structuredClone(makeFixtures.base);
  doc['@context'] = context;
  doc.id = ANCHOR_LIST_URL;
  if(doc.issuer) {
    doc.issuer.id = anchor.did;
  }
  const [entity] = doc.credentialSubject;
  entity.id = issuer.did;
  entity.recognizedTo.recognizedBy = anchor.did;
  entity.recognizedTo.credentialValidator = {...passes};
  change(doc);
  return sign(doc, anchor);
}

// The anchor's list for the known issuer, with one change, using the test keys.
export async function anchorListWith(change) {
  const anchor = await keyFromLabel('vc-recognized-entities test anchor');
  const issuer = await keyFromLabel('vc-recognized-entities test issuer');
  return anchorList({anchor, issuer, change});
}

// The verifier refused the input: not recognized, or at least one error.
export function expectRefused(outcome, message) {
  const refused = !(outcome.recognized && outcome.actionRecognized) ||
    outcome.errors.length > 0;
  expect(refused, `${message}: must not be recognized, or must report an ` +
    'error').to.equal(true);
}
