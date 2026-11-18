#!/usr/bin/env node
/*
 * SPDX-License-Identifier: LicenseRef-w3c-3-clause-bsd-license-2008 OR LicenseRef-w3c-test-suite-license-2023
 */

// Writes the signed verifier fixtures under tests/fixtures/recognized-entities/
// signed/. Keys are fixed (see tests/signing.js), so implementers can configure
// the test anchor's DID in advance. Only public DIDs are written to the repo.
// Every proof is verified with the vc library before the files are written.

import * as makeFixtures from './make-fixtures.mjs';
import {
  CREDENTIALS_V2, DATA_INTEGRITY_CONTEXT, documentLoader, keyFromLabel,
  sign, TEST_CONTEXT, TEST_CONTEXT_URL, verifierSuites
} from '../tests/signing.js';
import {anchorList} from '../tests/helpers.js';
import {fileURLToPath} from 'node:url';
import fs from 'node:fs';
import path from 'node:path';
import {verifyCredential} from '@digitalbazaar/vc';

const here = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(here, '..', 'tests', 'fixtures',
  'recognized-entities', 'signed');
const ANCHOR_LIST_URL =
  'https://anchor.example/credentials/recognized-issuers.json';
const SCHEMA_URL = 'https://anchor.example/schemas/credential.json';

// The validators use the signature of 4.4.1.1, validate(credential, options),
// and recognize the three options of 4.4. Any other option makes them throw
// an error whose type is UNRECOGNIZED_OPTION_ERROR, as in the spec's example.
// The guard is part of each validator's source, so the suite can test it in
// isolation.
export const OPTIONS_GUARD =
  'export default function validate(credential, options = {}) {\n' +
  '  const recognized = [\'chain\', \'action\', \'evaluationDateTime\'];\n' +
  '  for(const key of Object.keys(options)) {\n' +
  '    if(!recognized.includes(key)) {\n' +
  '      const error = new Error(\'Unrecognized option: \' + key);\n' +
  '      error.type =\n' +
  '        \'https://www.w3.org/TR/vc-data-model#UNRECOGNIZED_OPTION_ERROR\';\n' +
  '      throw error;\n' +
  '    }\n' +
  '  }\n';

// A validator published as an inline JSON Schema data: URL (3.5).
const inlineSchema = schema => ({
  type: 'CredentialValidator',
  id: 'data:application/schema+json,' +
    encodeURIComponent(JSON.stringify(schema)),
  mediaType: 'application/schema+json'
});

// The shape lists for the statement tests, built in memory with the same keys
// and validator as the generator. Nothing is written to disk.
export async function shapeListsForTests() {
  const anchor = await keyFromLabel('vc-recognized-entities test anchor');
  const issuer = await keyFromLabel('vc-recognized-entities test issuer');
  const context = [CREDENTIALS_V2, DATA_INTEGRITY_CONTEXT, TEST_CONTEXT_URL];
  const passes = inlineSchema(
    {type: 'object', required: ['credentialSubject']});
  return buildShapeLists({anchor, issuer, context, passes});
}

// The shape fixtures: the conforming list and one violation per rule, all
// signed at run time. Used by the generator and by the statement tests.
export async function buildShapeLists({anchor, issuer, context, passes}) {
  const build = change => anchorList({
    anchor, issuer, context, passes, change
  });
  const conformingList = await build(() => {});
  const violationLists = {};
  for(const [key, mutate] of Object.entries(makeFixtures.violations)) {
    violationLists[key] = await build(mutate);
  }
  return {conformingList, violationLists};
}

export async function buildFixtureSet() {
  const anchor = await keyFromLabel('vc-recognized-entities test anchor');
  const issuer = await keyFromLabel('vc-recognized-entities test issuer');
  const unknown = await keyFromLabel('vc-recognized-entities unknown issuer');
  // The test context lets JSON-LD verifiers expand the custom terms.
  const context = [CREDENTIALS_V2, DATA_INTEGRITY_CONTEXT, TEST_CONTEXT_URL];

  // The anchor's credential listing the issuer as a recognized entity, with
  // the given credential validators. Every list uses the same id, so a
  // verifier sees the same credential under test and the same recognition;
  // only the validators differ.
  const anchorList = validators => sign({
    '@context': context,
    id: ANCHOR_LIST_URL,
    type: ['VerifiableCredential', 'RecognizedEntityCredential'],
    // The general properties of 3.1 are optional. The anchor publishes them
    // all, so the suite can check their values.
    issuer: {
      id: anchor.did,
      type: 'RecognizedIssuer',
      legalName: {'@value': 'Test Anchor Legal Name LLC', '@language': 'en'},
      image: 'data:image/png;base64,iVBORw0KGgo=',
      url: 'https://anchor.example/',
      sameAs: ['https://anchor.example/entities/test-anchor']
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
        credentialValidator: validators
      }
    }]
  }, anchor);
  // A JavaScript validator (4.4.1) is published as a data: URL too. It
  // accepts every credential. Used only in the exchange state, so the
  // verifier does not run it in the validator-pair tests.
  const jsValidator = {
    type: 'CredentialValidator',
    id: 'data:text/javascript,' + encodeURIComponent(
      OPTIONS_GUARD +
      '  return {valid: true, errors: [], warnings: []};\n' +
      '}\n'),
    mediaType: 'text/javascript'
  };
  // A JavaScript validator that rejects, and reports one error as a
  // ProblemDetails object (VC DM 2.0, section 7.2). Used only to test the
  // validation function's output in isolation.
  const invalidJsValidator = {
    type: 'CredentialValidator',
    id: 'data:text/javascript,' + encodeURIComponent(
      OPTIONS_GUARD +
      '  return {valid: false, errors: [{\n' +
      '    type: "https://anchor.example/problems/constraint-not-met",\n' +
      '    title: "Credential does not meet a constraint"}], warnings: []};\n' +
      '}\n'),
    mediaType: 'text/javascript'
  };
  const listCredential = await anchorList([{
    type: 'CredentialValidator',
    id: SCHEMA_URL,
    mediaType: 'application/schema+json'
  }, jsValidator, invalidJsValidator]);

  // Validator pair for 3.3-3. Schemas are inline data: URLs, so a verifier
  // needs no network access. The credential under test has validFrom and
  // credentialSubject, but no expirationDate.
  const passes = inlineSchema(
    {type: 'object', required: ['credentialSubject']});
  const passesToo = inlineSchema({type: 'object', required: ['validFrom']});
  const fails = inlineSchema(
    {type: 'object', required: ['expirationDate']});
  const validatorsPass = await anchorList([passes, passesToo]);
  const validatorsOneFails = await anchorList([passes, fails]);

  // JavaScript validator pair for 4.4.1.1 (2). Each validator returns a fixed
  // result, so the verifier's decision depends only on that result.
  const javaScriptValidator = verdict => ({
    type: 'CredentialValidator',
    id: 'data:text/javascript,' + encodeURIComponent(
      OPTIONS_GUARD +
      `  return {valid: ${verdict}, errors: [], warnings: []};\n` +
      '}\n'),
    mediaType: 'text/javascript'
  });
  const {conformingList, violationLists} = await buildShapeLists(
    {anchor, issuer, context, passes});

  const javaScriptPass = await anchorList([javaScriptValidator('true')]);
  const javaScriptFail = await anchorList([javaScriptValidator('false')]);

  // Known issuer: recognized through the anchor's list.
  const knownIssuerCredential = await sign({
    '@context': context,
    type: ['VerifiableCredential', 'ExampleCredential'],
    issuer: {
      id: issuer.did,
      recognizedIn: {id: ANCHOR_LIST_URL, type: 'RecognizedEntityCredential'}
    },
    validFrom: '2025-06-01T00:00:00Z',
    credentialSubject: {id: 'urn:example:subject', name: 'Test Subject'}
  }, issuer);

  // Unknown issuer: no recognition information at all.
  const unknownIssuerCredential = await sign({
    '@context': context,
    type: ['VerifiableCredential', 'ExampleCredential'],
    issuer: {id: unknown.did},
    validFrom: '2025-06-01T00:00:00Z',
    credentialSubject: {id: 'urn:example:subject', name: 'Test Subject'}
  }, unknown);

  const files = {
    'recognized-entity-credential.json': listCredential,
    'known-issuer-credential.json': knownIssuerCredential,
    'unknown-issuer-credential.json': unknownIssuerCredential,
    'recognized-entity-credential-validators-pass.json': validatorsPass,
    'recognized-entity-credential-validators-one-fails.json':
      validatorsOneFails,
    'recognized-entity-credential-js-pass.json': javaScriptPass,
    'recognized-entity-credential-js-fail.json': javaScriptFail,
    'recognized-entity-credential-conforming.json': conformingList
  };
  for(const doc of Object.values(files)) {
    const result = await verifyCredential({
      credential: doc, suite: verifierSuites(), documentLoader
    });
    if(!result.verified) {
      const id = doc.id ?? doc.issuer.id ?? doc.issuer;
      throw new Error(`Proof did not verify: ${id}`);
    }
  }

  const count = Object.keys(violationLists).length;
  console.log(`built ${count} violations in memory`);
  return {files, anchor, issuer, unknown, conformingList, violationLists};
}

// The documents that implementers configure, as files: the verifier's
// subjectFiles, the public keys, and the test context. Everything else is built
// in memory by buildFixtureSet and read by the tests.
const PUBLISHED = [
  'known-issuer-credential.json',
  'recognized-entity-credential.json'
];

export async function main() {
  const {files, anchor, issuer, unknown} = await buildFixtureSet();
  fs.mkdirSync(outDir, {recursive: true});
  fs.writeFileSync(path.join(outDir, 'recognized-entities-test-context.json'),
    JSON.stringify(TEST_CONTEXT, null, 2) + '\n');
  for(const name of PUBLISHED) {
    fs.writeFileSync(path.join(outDir, name),
      JSON.stringify(files[name], null, 2) + '\n');
  }
  fs.writeFileSync(path.join(outDir, 'keys.json'), JSON.stringify({
    anchor: anchor.did,
    issuer: issuer.did,
    unknownIssuer: unknown.did
  }, null, 2) + '\n');
  console.log(`wrote ${PUBLISHED.length} published signed fixtures; ` +
    'all proofs verified');
}

if(process.argv[1] && import.meta.url === `file://${process.argv[1]}`) {
  await main();
}
