/*
 * SPDX-License-Identifier: LicenseRef-w3c-3-clause-bsd-license-2008 OR LicenseRef-w3c-test-suite-license-2023
 */

// The signed documents the tests use, built once per run in memory. Only the
// documents implementers configure are files (see scripts/sign-fixtures.mjs).
import {buildFixtureSet} from '../scripts/sign-fixtures.mjs';

let fixtureSet;
const documents = async () => {
  fixtureSet ??= await buildFixtureSet();
  return fixtureSet.files;
};

// A copy of one signed document, by its file name, for example
// 'recognized-entity-credential-validators-pass.json'.
export async function signedDocument(name) {
  const files = await documents();
  if(!(name in files)) {
    throw new Error(`no signed document ${name}`);
  }
  return structuredClone(files[name]);
}
