/*
 * SPDX-License-Identifier: LicenseRef-w3c-3-clause-bsd-license-2008 OR LicenseRef-w3c-test-suite-license-2023
 */

import {setupStatementMatrix, statementTests} from '../statement-suite.js';
import {describe} from 'mocha';

// Spec section: 3.4 RecognizedEntityCredential
describe('3.4 RecognizedEntityCredential', function() {
  setupStatementMatrix(this);

  // 3-4-recognizedentitycredential-1
  statementTests('3-4-recognizedentitycredential-1');

  // 3-4-recognizedentitycredential-3
  statementTests('3-4-recognizedentitycredential-3');
});
