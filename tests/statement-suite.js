/*
 * SPDX-License-Identifier: LicenseRef-w3c-3-clause-bsd-license-2008 OR LicenseRef-w3c-test-suite-license-2023
 */

import {
  endpointUrls, exchangeUrls, implementationNames
} from './implementations.js';
import {publishedDocuments, verify} from './transport.js';
import {EVALUATION_DATE_TIME} from './http.js';
import {expect} from 'chai';
import {it} from 'mocha';
import {LINK} from './normative-links.js';
import {NORMATIVE} from './normative-statements.js';
import {readFile} from 'node:fs/promises';
import {runValidatorInSandbox} from './sandbox.js';
import {shapeListsForTests} from '../scripts/sign-fixtures.mjs';

// One matrix row per MUST/REQUIRED statement. The statement text is the row,
// and each column is a tagged implementation. A cell is one test of that
// implementation for that statement, made of at least one positive and one
// negative subtest. A test that cannot run is still recorded in its cell, as
// skipped, so the report shows every MUST/REQUIRED statement.
//
// Only outcomes the spec defines are asserted (see tests/transport.js for how
// they are read from an implementation):
// - accepted: the 4.3 result has recognized and actionRecognized both true,
//   and no errors (errors come only from credential validation, which then
//   fails, or from a raised error);
// - refused: the result is not recognized, or at least one error is reported;
// - an error type, where the spec names the one to raise or append.

const FIXTURES = new URL('./fixtures/recognized-entities/', import.meta.url);

// Sets the report flags on a describe block. Call it as
// `setupStatementMatrix(this)` inside `describe(..., function() {})`.
export function setupStatementMatrix(suite,
  {rowLabel = 'Normative statement'} = {}) {
  suite.report = true;
  suite.matrix = true;
  suite.implemented = implementationNames();
  suite.notImplemented = [];
  suite.rowLabel = rowLabel;
  suite.columnLabel = 'Implementation';
}

async function readFixture(relativePath) {
  return JSON.parse(await readFile(new URL(relativePath, FIXTURES), 'utf8'));
}

// Runs recognition on the named implementation.
export async function verifyOn(name, credentials, options) {
  const url = endpointUrls().get(name);
  expect(url, `${name} has no verify endpoint`).to.be.a('string');
  return verify(url, credentials, options);
}

const typesOf = outcome => outcome.errors.map(error => error?.type);

export function expectAccepted(outcome, message) {
  expect(outcome.recognized && outcome.actionRecognized,
    `${message}: recognized and actionRecognized must both be true ` +
    `(errors: ${JSON.stringify(typesOf(outcome))})`).to.equal(true);
  expect(typesOf(outcome), `${message}: no error may be reported`)
    .to.deep.equal([]);
}

// The known issuer's credential and the conforming anchor list. Every part of
// section 3 holds for it, so 4.3 recognizes the issuer for "issue".
let shapeLists;
const shapesForTests = async () => {
  shapeLists ??= await shapeListsForTests();
  return shapeLists;
};

export async function conformingChain() {
  const known = await readFixture('signed/known-issuer-credential.json');
  const {conformingList} = await shapesForTests();
  return [known, conformingList];
}

export async function acceptsConforming(name) {
  expectAccepted(await verifyOn(name, await conformingChain()),
    'the conforming list');
}

function javaScriptSource(id) {
  const match = /^data:text\/javascript,(.*)$/.exec(id ?? '');
  return match ? decodeURIComponent(match[1]) : undefined;
}

async function runValidationFunction(validator, credential, options,
  environment) {
  const source = javaScriptSource(validator.id);
  expect(source, 'JavaScript validator must be a data: URL')
    .to.be.a('string');
  const reply = await runValidatorInSandbox({
    source, input: {credential, options}, environment
  });
  expect(reply.ok, `the validation function raised: ${reply.error}`)
    .to.equal(true);
  return reply.result;
}

// Runs one validator twice, with a different clock and random seed each time,
// and expects the same result. A necessary condition of 4.4.1.1 (7) only: it
// cannot show that the function reads nothing else.
export async function expectRepeatable(validator, credential, options) {
  const first = await runValidationFunction(validator, credential, options,
    {now: Date.parse('2000-01-01T00:00:00Z'), seed: 1});
  const second = await runValidationFunction(validator, credential, options,
    {now: Date.parse('2040-06-15T12:34:56Z'), seed: 2});
  expect(second, 'same credential and options must give the same result, ' +
    'whatever the time and random numbers').to.deep.equal(first);
}

// Suite contract, not spec: the JavaScript validators the implementation
// publishes, read from its exchange URL.
export async function publishedJavaScriptValidators(name) {
  const exchange = exchangeUrls().get(name);
  if(typeof exchange !== 'string') {
    return null;
  }
  const state = await publishedDocuments(exchange);
  const credentials = state?.verifiableCredential ?? [];
  const list = credentials.find(
    vc => [].concat(vc?.type ?? []).includes('RecognizedEntityCredential'));
  const validators = credentials
    .flatMap(vc => [].concat(
      vc?.credentialSubject?.[0]?.recognizedTo?.credentialValidator ?? []))
    .filter(v => v?.mediaType === 'text/javascript');
  return {
    validators,
    options: {
      chain: list ? [list] : [],
      action: 'issue',
      evaluationDateTime: EVALUATION_DATE_TIME
    }
  };
}

// Thrown by a subtest that cannot run; the cell is skipped with this reason
// if every other subtest passed.
export class Skip extends Error {}

const positive = (label, run) => ({kind: 'positive', label, run});
const negative = (label, run) => ({kind: 'negative', label, run});

// Explicit checks written in a section file, as { positive: {label: run},
// negative: {label: run} }. Each run takes the implementation name.
function subtestsFrom(checks) {
  return name => [
    ...Object.entries(checks.positive ?? {}).map(([label, run]) =>
      positive(label, () => run(name))),
    ...Object.entries(checks.negative ?? {}).map(([label, run]) =>
      negative(label, () => run(name)))
  ];
}

// Registers the sentence for each row key, for the report's at-risk rows.
function registerRowText(key, text) {
  globalThis.interopRowText ??= {};
  globalThis.interopRowText[key] = text;
}

/**
 * Adds one cell per implementation for a MUST/REQUIRED statement. Every
 * subtest runs, failures are collected, and the cell fails once with all of
 * them. A cell with no negative, or no positive, fails as incomplete.
 *
 * @param {string} key - Statement key, such as '3-2-recognizedentity-1'.
 * @param {object} [checks] - Explicit checks for the row, written in the
 *   section file. A row without them (as the scaffold writes it) has no
 *   positive and no negative, so its cells fail as incomplete.
 */
export function statementTests(key, checks = null) {
  // the statement is the spec sentence, verbatim
  const statement = NORMATIVE[key];
  registerRowText(key, statement);
  const buildSubtests = subtestsFrom(checks ?? {});
  for(const name of implementationNames()) {
    it(`[MUST] ${statement}`, async function() {
      this.test.cell = {columnId: name, rowId: key, statement};
      this.test.link = LINK[key];
      const subtests = buildSubtests(name);
      const kinds = new Set(subtests.map(subtest => subtest.kind));
      const problems = [];
      for(const kind of ['positive', 'negative']) {
        if(!kinds.has(kind)) {
          problems.push(`incomplete: no ${kind} test for ${key}`);
        }
      }
      const skips = [];
      for(const {kind, label, run} of subtests) {
        try {
          await run();
        } catch(error) {
          if(error instanceof Skip) {
            skips.push(`${kind} (${label}): ${error.message}`);
          } else {
            problems.push(`${kind} (${label}): ${error.message}`);
          }
        }
      }
      if(problems.length > 0) {
        throw new Error(problems.join('\n'));
      }
      if(skips.length > 0) {
        this.test.cell.skipMessage = `${skips.join('; ')}; the other ` +
          'subtests passed';
        this.skip();
      }
    });
  }
}
