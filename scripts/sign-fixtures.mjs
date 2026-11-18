#!/usr/bin/env node
/*
 * SPDX-License-Identifier: LicenseRef-w3c-3-clause-bsd-license-2008 OR LicenseRef-w3c-test-suite-license-2023
 */

// Writes the hosted fixtures in fixtures/. The CI workflow publishes them on
// the report site, under
// https://w3c.github.io/vc-recognized-entities-test-suite/fixtures/.
//
// The documents are built with the same builders and test keys as the tests
// (tests/helpers.js), with their URLs set to the hosted ones. Each run signs
// them again, so only run it when a fixture has to change, and commit the
// result.
//
// Usage: node scripts/sign-fixtures.mjs

import {
  anchorListWith, CONFORMING_VALIDATOR_CODE, CREDENTIAL_SUBJECT_SCHEMA,
  knownCredentialDocument, validatorOf
} from '../tests/helpers.js';
import {mkdir, writeFile} from 'node:fs/promises';

const BASE =
  'https://w3c.github.io/vc-recognized-entities-test-suite/fixtures/';
const LIST_URL = BASE + 'anchor/recognized-issuers.json';
const SCHEMA_URL = BASE + 'validators/credential-subject.schema.json';

const out = new URL('../fixtures/', import.meta.url);

async function write(path, text) {
  const url = new URL(path, out);
  await mkdir(new URL('./', url), {recursive: true});
  await writeFile(url, text);
  console.log('wrote', path);
}

const json = document => JSON.stringify(document, null, 2) + '\n';

// The anchor's conforming list, at its hosted URL, with the hosted schema as
// its credential validator.
await write('anchor/recognized-issuers.json', json(await anchorListWith(doc => {
  doc.id = LIST_URL;
  validatorOf(doc).id = SCHEMA_URL;
})));

// The known issuer credential, recognized in the hosted list.
await write('known-issuer-credential.json', json(
  await knownCredentialDocument(doc => {
    doc.issuer.recognizedIn.id = LIST_URL;
  })));

// The validator files.
await write('validators/credential-subject.schema.json',
  json(CREDENTIAL_SUBJECT_SCHEMA));
await write('validators/conforming.js', CONFORMING_VALIDATOR_CODE.trimStart());
