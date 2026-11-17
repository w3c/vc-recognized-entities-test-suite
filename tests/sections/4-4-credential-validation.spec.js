/*
 * SPDX-License-Identifier: LicenseRef-w3c-3-clause-bsd-license-2008 OR LicenseRef-w3c-test-suite-license-2023
 */

import {setupStatementMatrix, statementTests} from '../statement-suite.js';
import {describe} from 'mocha';

// Spec section: 4.4 Credential Validation
describe('4.4 Credential Validation', function() {
  setupStatementMatrix(this);

  // 4-4-credential-validation-2
  statementTests('4-4-credential-validation-2');
});
