/*
 * SPDX-License-Identifier: LicenseRef-w3c-3-clause-bsd-license-2008 OR LicenseRef-w3c-test-suite-license-2023
 */

import {setupStatementMatrix, statementTests} from '../statement-suite.js';
import {describe} from 'mocha';

// Spec section: 1.1 Conformance
describe('1.1 Conformance', function() {
  setupStatementMatrix(this);

  // 1-1-conformance-1
  statementTests('1-1-conformance-1');

  // 1-1-conformance-2
  statementTests('1-1-conformance-2');
});
