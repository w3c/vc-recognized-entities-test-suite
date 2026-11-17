#!/usr/bin/env node
/*
 * SPDX-License-Identifier: LicenseRef-w3c-3-clause-bsd-license-2008 OR LicenseRef-w3c-test-suite-license-2023
 */

// Writes the fixtures for the identifier-based discovery rows (section 4.2):
//
//   identifier-registry.json: the controlled identifier documents of the whois
//     issuers in tests/identifiers.js, and the presentation each WhoisService
//     endpoint serves. A verifier under test resolves the identifiers and
//     retrieves the endpoints from this file, never from the network.
//   identifier-intermediate-anchor-list.json: the anchor's list that
//     recognizes the intermediate. The holder staples it to the request.
//
// It is separate from sign-fixtures.mjs because proofs carry a creation time,
// so running that script rewrites every fixture. Every proof that should
// verify is checked before the files are written.

import {
  documentLoader as baseLoader, CREDENTIALS_V2, DATA_INTEGRITY_CONTEXT,
  keyFromLabel, verifierSuites
} from '../tests/signing.js';
import {
  INTERMEDIATE_ANCHOR_LIST, LOOPBACK_ENDPOINT, WHOIS_ISSUERS, whoisEndpoint,
  whoisId, whoisKey
} from '../tests/identifiers.js';
import {
  createSignCryptosuite
} from '@digitalbazaar/eddsa-jcs-2022-cryptosuite';
import {DataIntegrityProof} from '@digitalbazaar/data-integrity';
import {fileURLToPath} from 'node:url';
import fs from 'node:fs';
import jsonldSignatures from 'jsonld-signatures';
import {list} from '../tests/chains.js';
import path from 'node:path';
import {verifyCredential} from '@digitalbazaar/vc';

const {purposes: {ControllerProofPurpose}} = jsonldSignatures;

const here = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(here, '..', 'tests', 'fixtures',
  'recognized-entities', 'signed');
const ANCHOR_LIST = 'https://anchor.example/lists/whois-anchor.json';
const OTHER_LIST = 'https://anchor.example/lists/whois-unknown-recognizer.json';
const INTERMEDIATE_LIST = 'https://anchor.example/lists/whois-intermediate.json';

// A controlled identifier document with one Multikey, for assertions and
// authentication, and the given services.
function identifierDocument(name, {publicKeyMultibase}, services) {
  const id = whoisId(name);
  const methodId = `${id}#key-1`;
  return {
    // The did/v1 context, as for did:key, so JSON-LD verifiers can load it
    // locally.
    '@context': ['https://www.w3.org/ns/did/v1'],
    id,
    verificationMethod: [{
      '@context': ['https://w3id.org/security/multikey/v1'],
      id: methodId,
      type: 'Multikey',
      controller: id,
      publicKeyMultibase
    }],
    assertionMethod: [methodId],
    authentication: [methodId],
    service: services.map(({type, serviceEndpoint}) => ({
      id: `${id}#whois`, type, serviceEndpoint
    }))
  };
}

// Signs a presentation for authentication, as in the spec's example 9.
async function signPresentation(presentation, {key}) {
  const suite = new DataIntegrityProof({
    signer: key.signer(), cryptosuite: createSignCryptosuite()
  });
  return jsonldSignatures.sign(presentation, {
    suite, purpose: new ControllerProofPurpose({term: 'authentication'}),
    documentLoader: baseLoader
  });
}

const presentationOf = (name, credentials) => ({
  '@context': [CREDENTIALS_V2, DATA_INTEGRITY_CONTEXT],
  id: `urn:example:whois:${name}`,
  type: ['VerifiablePresentation'],
  holder: whoisId(name),
  verifiableCredential: credentials
});

export async function main() {
  const anchor = await keyFromLabel('vc-recognized-entities test anchor');
  const unknown = await keyFromLabel(
    'vc-recognized-entities whois unknown recognizer');
  const intermediate = await keyFromLabel(
    'vc-recognized-entities whois intermediate');

  const anchorList = entityId => list({
    signer: anchor, id: ANCHOR_LIST, entityId
  });
  const unknownList = entityId => list({
    signer: unknown, id: OTHER_LIST, entityId
  });
  const intermediateList = (entityId, recognizedIn) => list({
    signer: intermediate, id: INTERMEDIATE_LIST, entityId, recognizedIn
  });

  const documents = [];
  const endpoints = {};
  const keys = {};
  for(const name of WHOIS_ISSUERS) {
    keys[name] = await whoisKey(name);
  }
  const both = ['WhoisService', 'PathService'];
  // Adds an issuer: its document with one service, and what that service's
  // endpoint serves (nothing when `credentials` is undefined).
  const add = async (name, {type = both, endpoint = whoisEndpoint(name),
    credentials, signer = keys[name], change}) => {
    documents.push(identifierDocument(name, keys[name].key,
      [{type, serviceEndpoint: endpoint}]));
    if(credentials !== undefined) {
      let presentation = await signPresentation(
        presentationOf(name, credentials), signer);
      if(change) {
        presentation = change(presentation);
      }
      endpoints[endpoint] = presentation;
    }
  };

  const id = whoisId;
  await add('accepted', {credentials: [await anchorList(id('accepted'))]});
  await add('unknown-recognizer', {
    credentials: [await unknownList(id('unknown-recognizer'))]});
  await add('whois-only', {type: ['WhoisService'],
    credentials: [await anchorList(id('whois-only'))]});
  await add('path-only', {type: ['PathService'],
    credentials: [await anchorList(id('path-only'))]});
  await add('unserved', {});
  await add('loopback', {endpoint: LOOPBACK_ENDPOINT,
    credentials: [await anchorList(id('loopback'))]});
  await add('tampered', {
    credentials: [await anchorList(id('tampered'))],
    change: presentation => ({
      ...presentation, id: `${presentation.id}:changed`
    })
  });
  await add('wrong-signer', {
    credentials: [await anchorList(id('wrong-signer'))],
    signer: keys.accepted
  });
  await add('other-entity', {
    credentials: [await anchorList(id('someone-else'))]});
  await add('two-lists', {credentials: [
    await unknownList(id('two-lists')), await anchorList(id('two-lists'))]});
  await add('via-intermediate', {credentials: [
    await intermediateList(id('via-intermediate'), INTERMEDIATE_ANCHOR_LIST)]});
  await add('intermediate-no-recognized-in', {credentials: [
    await intermediateList(id('intermediate-no-recognized-in'))]});

  const stapled = await list({
    signer: anchor, id: INTERMEDIATE_ANCHOR_LIST, entityId: intermediate.did
  });

  // Checks: every list verifies, and every presentation verifies against its
  // holder's document, except the two that are meant to fail.
  const byId = new Map(documents.map(doc => [doc.id, doc]));
  const loader = async url => {
    const [did] = url.split('#');
    const doc = byId.get(did);
    if(doc === undefined) {
      return baseLoader(url);
    }
    const document = did === url ? doc :
      doc.verificationMethod.find(method => method.id === url);
    return {contextUrl: null, documentUrl: url, document};
  };
  const credentials = [stapled, ...Object.values(endpoints)
    .flatMap(vp => vp.verifiableCredential)];
  for(const credential of credentials) {
    const result = await verifyCredential({
      credential, suite: verifierSuites(), documentLoader: baseLoader
    });
    if(!result.verified) {
      throw new Error(`Proof did not verify: ${credential.id}`);
    }
  }
  for(const [url, presentation] of Object.entries(endpoints)) {
    const holder = byId.get(presentation.holder);
    const result = await jsonldSignatures.verify(presentation, {
      suite: verifierSuites(), documentLoader: loader,
      purpose: new ControllerProofPurpose(
        {term: 'authentication', controller: holder})
    });
    const expected = !url.includes('/tampered/') &&
      !url.includes('/wrong-signer/');
    if(result.verified !== expected) {
      throw new Error(`Presentation at ${url}: verified is ` +
        `${result.verified}, expected ${expected}.`);
    }
  }

  fs.writeFileSync(path.join(outDir, 'identifier-registry.json'),
    JSON.stringify({documents, endpoints}, null, 2) + '\n');
  fs.writeFileSync(
    path.join(outDir, 'identifier-intermediate-anchor-list.json'),
    JSON.stringify(stapled, null, 2) + '\n');
  console.log(`wrote ${documents.length} identifier documents and ` +
    `${Object.keys(endpoints).length} presentations; proofs checked`);
}

if(process.argv[1] && import.meta.url === `file://${process.argv[1]}`) {
  await main();
}
