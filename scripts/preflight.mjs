#!/usr/bin/env node
/*
 * SPDX-License-Identifier: LicenseRef-w3c-3-clause-bsd-license-2008 OR LicenseRef-w3c-test-suite-license-2023
 */

// Checks that each tagged implementation can be reached before a full run:
// its verify endpoint answers a request made as tests/transport.js makes it,
// with a body that parses as JSON. Nothing about the answer is checked, since
// the spec defines no request format or status code. Prints PASS or FAIL for
// each implementation, and exits 1 if any fails. Run with: npm run preflight
// (the verifier must be running).

import * as documents from '../tests/documents.js';
import {endpointUrls, implementationNames} from '../tests/implementations.js';
import {readFile} from 'node:fs/promises';
import {verify} from '../tests/transport.js';

const FIXTURES = new URL(
  '../tests/fixtures/recognized-entities/signed/', import.meta.url);

async function fixture(name) {
  return JSON.parse(await readFile(new URL(name, FIXTURES), 'utf8'));
}

let failures = 0;
for(const name of implementationNames()) {
  const url = endpointUrls().get(name);
  let detail;
  try {
    if(typeof url !== 'string') {
      throw new Error('no verify endpoint in the verifier entry');
    }
    await verify(url, [
      await fixture('known-issuer-credential.json'),
      await documents.signedDocument(
        'recognized-entity-credential-validators-pass.json')
    ]);
    detail = `${url} returned a JSON body`;
  } catch(error) {
    failures++;
    detail = `error: ${error.message}`;
  }
  console.log(`${detail.startsWith('error') ? 'FAIL' : 'PASS'}  ${name}: ` +
    detail);
}
console.log(failures === 0 ?
  '\nall implementations reachable' : `\n${failures} implementation(s) failed`);
process.exit(failures === 0 ? 0 : 1);
