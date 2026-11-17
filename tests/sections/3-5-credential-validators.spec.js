/*
 * SPDX-License-Identifier: LicenseRef-w3c-3-clause-bsd-license-2008 OR LicenseRef-w3c-test-suite-license-2023
 */

import {setupStatementMatrix, statementTests} from '../statement-suite.js';
import {describe} from 'mocha';

// Spec section: 3.5 Credential Validators
describe('3.5 Credential Validators', function() {
  setupStatementMatrix(this);

  // 3-5-credential-validators-1
  statementTests('3-5-credential-validators-1');

  // 3-5-credential-validators-2
  statementTests('3-5-credential-validators-2');

  // 3-5-credential-validators-4
  statementTests('3-5-credential-validators-4');

  // 3-5-credential-validators-5
  statementTests('3-5-credential-validators-5');
});
