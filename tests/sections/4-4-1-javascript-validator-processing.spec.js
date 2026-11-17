/*
 * SPDX-License-Identifier: LicenseRef-w3c-3-clause-bsd-license-2008 OR LicenseRef-w3c-test-suite-license-2023
 */

import {setupStatementMatrix, statementTests} from '../statement-suite.js';
import {describe} from 'mocha';

// Spec section: 4.4.1 JavaScript Validator Processing
describe('4.4.1 JavaScript Validator Processing', function() {
  setupStatementMatrix(this);

  // 4-4-1-javascript-validator-processing-2
  statementTests('4-4-1-javascript-validator-processing-2');
});
