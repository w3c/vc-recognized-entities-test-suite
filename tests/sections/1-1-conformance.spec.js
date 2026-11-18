/*
 * SPDX-License-Identifier: LicenseRef-w3c-3-clause-bsd-license-2008 OR LicenseRef-w3c-test-suite-license-2023
 */

// Hand-written: scripts/scaffold-tests.mjs does not regenerate this file.

import {
  acceptsConforming, eachViolationList, expectRefused, setupStatementMatrix,
  statementTests
} from '../statement-suite.js';
import {describe} from 'mocha';
import {expect} from 'chai';

// Spec section: 1.1 Conformance
describe('1.1 Conformance', function() {
  setupStatementMatrix(this);

  // 1-1-conformance-1: Specifically, all relevant normative statements in
  // Section 3. Data Model of this document MUST be enforced.
  statementTests('1-1-conformance-1', {
    positive: {
      'the conforming credential is recognized': acceptsConforming
    },
    negative: {
      'every violation fixture is refused (one per section 3 rule)':
        name => eachViolationList(name, expectRefused)
    }
  });

  // 1-1-conformance-2: Conforming processors MUST produce errors when
  // non-conforming documents are consumed.
  statementTests('1-1-conformance-2', {
    positive: {
      'the conforming credential produces no errors': acceptsConforming
    },
    negative: {
      'every violation fixture produces at least one error':
        name => eachViolationList(name, (outcome, file) =>
          expect(outcome.errors, `${file}: errors`).to.not.be.empty)
    }
  });
});
