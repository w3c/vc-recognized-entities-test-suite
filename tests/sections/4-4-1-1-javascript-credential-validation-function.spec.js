/*
 * SPDX-License-Identifier: LicenseRef-w3c-3-clause-bsd-license-2008 OR LicenseRef-w3c-test-suite-license-2023
 */

import {setupStatementMatrix, statementTests} from '../statement-suite.js';
import {describe} from 'mocha';

// Spec section: 4.4.1.1 JavaScript Credential Validation Function
describe('4.4.1.1 JavaScript Credential Validation Function', function() {
  setupStatementMatrix(this);

  // 4-4-1-1-javascript-credential-validation-function-2
  statementTests('4-4-1-1-javascript-credential-validation-function-2');

  // 4-4-1-1-javascript-credential-validation-function-4
  statementTests('4-4-1-1-javascript-credential-validation-function-4');

  // 4-4-1-1-javascript-credential-validation-function-6
  statementTests('4-4-1-1-javascript-credential-validation-function-6');

  // 4-4-1-1-javascript-credential-validation-function-7
  statementTests('4-4-1-1-javascript-credential-validation-function-7');
});
