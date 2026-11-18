/*
 * SPDX-License-Identifier: LicenseRef-w3c-3-clause-bsd-license-2008 OR LicenseRef-w3c-test-suite-license-2023
 */

// Hand-written: scripts/scaffold-tests.mjs does not regenerate this file.
//
// Each row is one spec statement, titled with its sentence. The checks are
// written out below. Each violation is one change made to the known-issuer
// credential (scripts/make-fixtures.mjs), and the verifier must refuse it.

import {
  conformingChain, expectAccepted, expectRefused, setupStatementMatrix,
  statementTests, verifyOn, violationOutcome
} from '../statement-suite.js';
import {describe} from 'mocha';
import {expect} from 'chai';
import {NORMATIVE} from '../normative-statements.js';

// [fixture key, the change made to the credential, the statement it breaks]
const VIOLATIONS = [
  ['3-1-general-properties-2', 'delete the issuer type', '3.1 (2)'],
  ['3-1-general-properties-3', 'issuer legalName = 42', '3.1 (3)'],
  ['3-1-general-properties-4', 'issuer image = "not a url"', '3.1 (4)'],
  ['3-1-general-properties-5', 'issuer url = "not a url"', '3.1 (5)'],
  ['3-1-general-properties-6', 'issuer sameAs = ["not a url"]', '3.1 (6)'],
  ['3-2-recognizedentity-1', 'subject type = RecognizedIssuer', '3.2 (1)'],
  ['3-2-recognizedentity-2', 'recognizedIn.id = "not a url"', '3.2 (2)'],
  ['3-2-recognizedentity-3', 'recognizedIn.type = 42', '3.2 (3)'],
  ['3-2-recognizedentity-5', 'subject type = RecognizedIssuer (as 3.2 (1))',
    '3.2 (5)'],
  ['3-3-recognizedaction-1', 'recognizedTo.type = RecognizedEntity', '3.3 (1)'],
  ['3-3-recognizedaction-2', 'credentialValidator = []', '3.3 (2)'],
  ['3-3-recognizedaction-4', 'validFrom has milliseconds', '3.3 (4)'],
  ['3-3-recognizedaction-6',
    'validUntil 30 days from now (date set at run time)', '3.3 (6)'],
  ['3-4-recognizedentitycredential-1', 'delete the issuer', '3.4 (1)'],
  ['3-4-recognizedentitycredential-3', 'type = [VerifiableCredential] only',
    '3.4 (3)'],
  ['3-5-credential-validators-1', 'delete validator id', '3.5 (1)'],
  ['3-5-credential-validators-2', 'validator id = "schema.json"', '3.5 (2)'],
  ['3-5-credential-validators-4', 'validator type = JsonSchema', '3.5 (4)'],
  ['3-5-credential-validators-5', 'delete validator mediaType', '3.5 (5)']
];

// One negative per violation. The label gives the change and the statement.
function violationChecks(check) {
  const checks = {};
  for(const [key, change, statement] of VIOLATIONS) {
    checks[`${key}: ${change} (breaks ${statement})`] =
      name => check(name, key);
  }
  return checks;
}

describe('1.1 Conformance', function() {
  setupStatementMatrix(this);

  describe(`1-1-conformance-1: ${NORMATIVE['1-1-conformance-1']}`,
    function() {
      statementTests('1-1-conformance-1', {
        positive: {
          // the conforming credential is accepted with no errors
          'the conforming credential is recognized': async name =>
            expectAccepted(await verifyOn(name, await conformingChain()),
              'the conforming list')
        },
        negative: violationChecks(async (name, key) =>
          // the credential with this one change is refused
          expectRefused(await violationOutcome(name, key), key))
      });
    });

  describe(`1-1-conformance-2: ${NORMATIVE['1-1-conformance-2']}`,
    function() {
      statementTests('1-1-conformance-2', {
        positive: {
          // the conforming credential produces no errors
          'the conforming credential produces no errors': async name =>
            expectAccepted(await verifyOn(name, await conformingChain()),
              'the conforming list')
        },
        negative: violationChecks(async (name, key) => {
          // the credential with this one change produces at least one error
          const outcome = await violationOutcome(name, key);
          expect(outcome.errors, `${key}: errors`).to.not.be.empty;
        })
      });
    });
});
