/*
 * SPDX-License-Identifier: LicenseRef-w3c-3-clause-bsd-license-2008 OR LicenseRef-w3c-test-suite-license-2023
 */

import * as documents from '../../tests/documents.js';
import {describe, it} from 'mocha';
import {
  documentLoader, verifierSuites
} from '../../tests/signing.js';
import {expect} from 'chai';
import {fileURLToPath} from 'node:url';
import fs from 'node:fs';
import path from 'node:path';
import {verifyCredential} from '@digitalbazaar/vc';

// Reloads the committed signed fixtures and verifies each proof with the vc
// library, from the public DIDs alone. The signing script is not used.
const dir = path.join(path.dirname(fileURLToPath(import.meta.url)),
  '..', '..', 'tests', 'fixtures', 'recognized-entities', 'signed');
const load = name => JSON.parse(fs.readFileSync(path.join(dir, name), 'utf8'));
const keys = load('keys.json');

async function verifies(credential) {
  const result = await verifyCredential({
    credential, suite: verifierSuites(), documentLoader
  });
  return result.verified;
}

describe('signed fixtures', () => {
  for(const name of [
    'recognized-entity-credential.json',
    'known-issuer-credential.json',
    'unknown-issuer-credential.json'
  ]) {
    it(`${name} has a proof that verifies`, async () => {
      expect(await verifies(await documents.signedDocument(name))).to.be.true;
    });
  }

  it('known issuer points at the anchor list', () => {
    const known = load('known-issuer-credential.json');
    const list = load('recognized-entity-credential.json');
    expect(known.issuer.recognizedIn.id).to.equal(list.id);
    expect(list.issuer.id).to.equal(keys.anchor);
    expect(list.issuer.type).to.equal('RecognizedIssuer');
    expect(list.credentialSubject[0].id).to.equal(keys.issuer);
  });

  it('unknown issuer has no recognizedIn', async () => {
    const unknown = await documents.signedDocument(
      'unknown-issuer-credential.json');
    expect(unknown.issuer.recognizedIn).to.be.undefined;
  });
});
