/*
 * SPDX-License-Identifier: LicenseRef-w3c-3-clause-bsd-license-2008 OR LicenseRef-w3c-test-suite-license-2023
 */

import * as chains from './chains.js';
import * as documents from './documents.js';
import * as makeFixtures from '../scripts/make-fixtures.mjs';
import {
  endpointUrls, exchangeUrls, implementationNames
} from './implementations.js';
import {OPTIONS_GUARD, shapeListsForTests} from '../scripts/sign-fixtures.mjs';
import {publishedDocuments, verify} from './transport.js';
import {EVALUATION_DATE_TIME} from './http.js';
import {expect} from 'chai';
import {it} from 'mocha';
import {LINK} from './normative-links.js';
import {NORMATIVE} from './normative-statements.js';
import {readFile} from 'node:fs/promises';
import {runValidatorInSandbox} from './sandbox.js';

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
const VCDM = 'https://www.w3.org/TR/vc-data-model#';
const CREDENTIAL_VALIDATION_ERROR = VCDM + 'CREDENTIAL_VALIDATION_ERROR';
const UNRECOGNIZED_OPTION_ERROR = VCDM + 'UNRECOGNIZED_OPTION_ERROR';

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
async function verifyOn(name, credentials, options) {
  const url = endpointUrls().get(name);
  expect(url, `${name} has no verify endpoint`).to.be.a('string');
  return verify(url, credentials, options);
}

const typesOf = outcome => outcome.errors.map(error => error?.type);

function expectAccepted(outcome, message) {
  expect(outcome.recognized && outcome.actionRecognized,
    `${message}: recognized and actionRecognized must both be true ` +
    `(errors: ${JSON.stringify(typesOf(outcome))})`).to.equal(true);
  expect(typesOf(outcome), `${message}: no error may be reported`)
    .to.deep.equal([]);
}

export function expectRefused(outcome, message) {
  const refused = !(outcome.recognized && outcome.actionRecognized) ||
    outcome.errors.length > 0;
  expect(refused, `${message}: must not be recognized, or must report an ` +
    'error').to.equal(true);
}

function expectErrorType(outcome, type, message) {
  expect(typesOf(outcome), message).to.include(type);
}

// The known issuer's credential and the conforming anchor list. Every part of
// section 3 holds for it, so 4.3 recognizes the issuer for "issue".
let shapeLists;
const shapesForTests = async () => {
  shapeLists ??= await shapeListsForTests();
  return shapeLists;
};

async function conformingChain() {
  const known = await readFixture('signed/known-issuer-credential.json');
  const {conformingList} = await shapesForTests();
  return [known, conformingList];
}

export async function acceptsConforming(name) {
  expectAccepted(await verifyOn(name, await conformingChain()),
    'the conforming list');
}

// 1.1 (1) and section 3: the violation of one statement is refused. It is the
// conforming list, or the known credential, with that one rule broken, so
// the refusal comes from that violation only.
// The verifier's outcome for the violation of one statement, built from the
// fixture named by key (see scripts/make-fixtures.mjs).
export async function violationOutcome(name, key) {
  const known = await readFixture('signed/known-issuer-credential.json');
  const {conformingList, violationLists} = await shapesForTests();
  const mutate = makeFixtures.credentialViolations[key];
  const credentials = mutate ?
    [await chains.knownCredentialDocument(mutate), conformingList] :
    [known, violationLists[key]];
  return verifyOn(name, credentials);
}

export async function refusesViolation(name, key) {
  expectRefused(await violationOutcome(name, key),
    `the violation of ${key}`);
}

export async function eachViolationList(name, check) {
  const known = await readFixture('signed/known-issuer-credential.json');
  const {violationLists} = await shapesForTests();
  const files = Object.keys(violationLists);
  expect(files, 'no violation lists').to.not.be.empty;
  const failures = [];
  for(const file of files) {
    try {
      check(await verifyOn(name, [known, violationLists[file]]), file);
    } catch(error) {
      failures.push(error.message);
    }
  }
  expect(failures, 'violation lists').to.deep.equal([]);
}

// A validator published in a list the suite builds, posted with the known
// credential.
const validatorChain = (code, mediaType = 'text/javascript') =>
  chains.chainWithValidators([{
    type: 'CredentialValidator',
    id: 'data:text/javascript,' + encodeURIComponent(code),
    mediaType
  }]);

async function acceptsValidator(name, code, message) {
  const outcome = await verifyOn(name, await validatorChain(code));
  expectAccepted(outcome, message);
  return outcome;
}

// 4.4.1: a validator whose code or output breaks a statement makes credential
// validation append CREDENTIAL_VALIDATION_ERROR, so the action is not
// recognized.
async function refusesBrokenValidator(name, code) {
  const outcome = await verifyOn(name, await validatorChain(code));
  expectRefused(outcome, 'a validator that breaks the statement');
  expectErrorType(outcome, CREDENTIAL_VALIDATION_ERROR,
    'the result must report CREDENTIAL_VALIDATION_ERROR');
}

// 4.4: an unsupported mediaType appends CREDENTIAL_VALIDATION_ERROR.
async function refusesUnsupportedMediaType(name, mediaType) {
  const outcome = await verifyOn(name, await validatorChain(
    'export default function validate() {\n' +
    '  return {valid: true, errors: [], warnings: []};\n}\n', mediaType));
  expectRefused(outcome, `mediaType ${mediaType}`);
  expectErrorType(outcome, CREDENTIAL_VALIDATION_ERROR,
    `mediaType ${mediaType} must report CREDENTIAL_VALIDATION_ERROR`);
}

// Validators the data model accepts but section 4.4 refuses.
const VALIDATOR_NEGATIVES = {
  '3-5-credential-validators-5': {mediaType: 'text/plain'}
};

const HEAD = 'export default function validate(credential, options) {\n';
const ACCEPTS = HEAD + '  return {valid: true, errors: [], warnings: []};\n}\n';
const NOT_A_MODULE = 'return {valid: true, errors: [], warnings: []};\n';
const DEFAULT_NOT_FUNCTION = 'export default 42;\n';
const NON_BOOLEAN_VALID = HEAD +
  '  return {valid: \'yes\', errors: [], warnings: []};\n}\n';
const VALID_WITH_ERRORS = HEAD + '  return {valid: true, warnings: [],\n' +
  '    errors: [{type: \'https://anchor.example/problems/broken\', ' +
  'title: \'Broken\'}]};\n}\n';
const NON_PROBLEM_ITEM = HEAD +
  '  return {valid: false, errors: [\'a plain string\'], warnings: []};\n}\n';
const NOTE = 'https://anchor.example/problems/note';
const WITH_WARNING = HEAD + '  return {valid: true, errors: [],\n' +
  `    warnings: [{type: '${NOTE}', title: 'Note'}]};\n}\n`;
// Accepts the three options of 4.4 and throws UNRECOGNIZED_OPTION_ERROR for
// any other, as the spec's example does.
const GUARDED = OPTIONS_GUARD +
  '  return {valid: true, errors: [], warnings: []};\n}\n';
// A validator that does not recognize an option the verifier passed.
const THROWS_UNRECOGNIZED = HEAD +
  '  const error = new Error(\'Unrecognized option\');\n' +
  `  error.type = '${UNRECOGNIZED_OPTION_ERROR}';\n` +
  '  throw error;\n}\n';

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
async function publishedJavaScriptValidators(name) {
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
class Skip extends Error {}

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

// The subtests of each statement. A statement with no entry here is a
// section 3 statement: its positive is the conforming list, and its negative
// the violation fixture of that statement.
const SUBTESTS = {
  // 1.1 (1): "Data Model of this document MUST be enforced."
  '1-1-conformance-1': name => [
    positive('the conforming list is recognized',
      () => acceptsConforming(name)),
    negative('every violation list is refused', () => eachViolationList(name,
      (outcome, file) => expectRefused(outcome, file)))
  ],
  // 3.3 (3): every validator must be satisfied. A controlled pair: two lists
  // that differ only in whether one validator rejects.
  '3-3-recognizedaction-3': name => [
    positive('accepted when every validator accepts', async () => {
      const known = await readFixture('signed/known-issuer-credential.json');
      expectAccepted(await verifyOn(name, [known,
        await documents.signedDocument(
          'recognized-entity-credential-validators-pass.json')]),
      'every validator accepts');
    }),
    negative('refused when one validator rejects', async () => {
      const known = await readFixture('signed/known-issuer-credential.json');
      expectRefused(await verifyOn(name, [known, await documents.signedDocument(
        'recognized-entity-credential-validators-one-fails.json')]),
      'one validator rejects');
    })
  ],
  // 4.4 (2): a validator throws UNRECOGNIZED_OPTION_ERROR for an option it
  // does not recognize. 4.4.1 says what the verifier does with that throw.
  '4-4-credential-validation-2': name => [
    positive('a validator that guards its options accepts the options of 4.4',
      () => acceptsValidator(name, GUARDED, 'guarded validator')),
    negative('a thrown UNRECOGNIZED_OPTION_ERROR is reported', async () => {
      const outcome = await verifyOn(name,
        await validatorChain(THROWS_UNRECOGNIZED));
      expectRefused(outcome, 'a validator that throws');
      expectErrorType(outcome, UNRECOGNIZED_OPTION_ERROR,
        'the result must report UNRECOGNIZED_OPTION_ERROR');
    })
  ],
  // 4.4.1 (2): the code is an ES module whose default export is a function.
  '4-4-1-javascript-validator-processing-2': name => [
    positive('a module that default-exports a function is run',
      () => acceptsValidator(name, ACCEPTS, 'module validator')),
    negative('code that is not a module is refused',
      () => refusesBrokenValidator(name, NOT_A_MODULE)),
    negative('a default export that is not a function is refused',
      () => refusesBrokenValidator(name, DEFAULT_NOT_FUNCTION))
  ],
  // 4.4.1.1: valid is a REQUIRED boolean.
  '4-4-1-1-javascript-credential-validation-function-2': name => [
    positive('valid true is accepted', async () => {
      const known = await readFixture('signed/known-issuer-credential.json');
      expectAccepted(await verifyOn(name, [known,
        await documents.signedDocument(
          'recognized-entity-credential-js-pass.json')]), 'valid true');
    }),
    negative('valid false is refused', async () => {
      const known = await readFixture('signed/known-issuer-credential.json');
      expectRefused(await verifyOn(name, [known, await documents.signedDocument(
        'recognized-entity-credential-js-fail.json')]), 'valid false');
    }),
    negative('a non-boolean valid is refused',
      () => refusesBrokenValidator(name, NON_BOOLEAN_VALID))
  ],
  // 4.4.1.1: if valid is true, errors is empty or absent.
  '4-4-1-1-javascript-credential-validation-function-4': name => [
    positive('valid true with no errors is accepted',
      () => acceptsValidator(name, ACCEPTS, 'valid true, errors []')),
    negative('valid true with an error is refused',
      () => refusesBrokenValidator(name, VALID_WITH_ERRORS))
  ],
  // 4.4.1.1: each item in errors and warnings is a ProblemDetails object.
  // 4.3 carries the warnings of credential validation into the result.
  '4-4-1-1-javascript-credential-validation-function-6': name => [
    positive('a ProblemDetails warning is accepted and reported', async () => {
      const outcome = await acceptsValidator(name, WITH_WARNING,
        'valid true with a ProblemDetails warning');
      expect(outcome.warnings.map(w => w?.type), 'the warning is reported')
        .to.include(NOTE);
    }),
    negative('an item that is not a ProblemDetails object is refused',
      () => refusesBrokenValidator(name, NON_PROBLEM_ITEM))
  ],
  // 4.4.1.1 (7): the function depends only on credential and options. The
  // spec states no verifier behavior for a validator that breaks this, so there
  // is no implementation negative. The checker's own negatives live in tools/.
  // The positive runs the validators the implementation publishes (suite
  // contract, not spec).
  '4-4-1-1-javascript-credential-validation-function-7': function(name) {
    const noSpecNegative = () => {
      throw new Skip('the spec states no verifier behavior for a validator ' +
        'that reads the clock or random numbers, so there is no ' +
        'implementation negative');
    };
    return [
      negative('no spec-stated refusal for a validator that reads the clock',
        noSpecNegative),
      negative('no spec-stated refusal for a validator that reads random ' +
        'numbers', noSpecNegative),
      positive('published validators give the same result for the same ' +
        'input (suite contract, not spec)', async () => {
        const published = await publishedJavaScriptValidators(name);
        if(!published) {
          throw new Skip('no exchange URL configured, so no published ' +
            'validator to run');
        }
        if(published.validators.length === 0) {
          throw new Skip('no JavaScript validators published by this ' +
            'implementation');
        }
        const credential = await readFixture(
          'signed/known-issuer-credential.json');
        for(const validator of published.validators) {
          await expectRepeatable(validator, credential, published.options);
        }
      })
    ];
  }
};

function section3Subtests(name, key) {
  const subtests = [positive('the conforming list is recognized',
    () => acceptsConforming(name))];
  if(makeFixtures.violations[key] || makeFixtures.credentialViolations[key]) {
    subtests.push(negative(`the violation of ${key} is refused`,
      () => refusesViolation(name, key)));
  }
  if(VALIDATOR_NEGATIVES[key]) {
    const {mediaType} = VALIDATOR_NEGATIVES[key];
    subtests.push(negative(`mediaType ${mediaType} is refused`,
      () => refusesUnsupportedMediaType(name, mediaType)));
  }
  return subtests;
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
 * @param {object} [checks] - Explicit checks for the row; see the section file.
 */
export function statementTests(key, checks = null) {
  // the statement is the spec sentence, verbatim
  const statement = NORMATIVE[key];
  registerRowText(key, statement);
  const buildSubtests = checks ? subtestsFrom(checks) : name =>
    SUBTESTS[key] ? SUBTESTS[key](name) : section3Subtests(name, key);
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
