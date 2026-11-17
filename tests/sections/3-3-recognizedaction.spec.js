/*
 * SPDX-License-Identifier: LicenseRef-w3c-3-clause-bsd-license-2008 OR LicenseRef-w3c-test-suite-license-2023
 */

import {setupStatementMatrix, statementTests} from '../statement-suite.js';
import {describe} from 'mocha';

// Spec section: 3.3 RecognizedAction
describe('3.3 RecognizedAction', function() {
  setupStatementMatrix(this);

  // 3-3-recognizedaction-1
  statementTests('3-3-recognizedaction-1');

  // 3-3-recognizedaction-2
  statementTests('3-3-recognizedaction-2');

  // 3-3-recognizedaction-3
  statementTests('3-3-recognizedaction-3');

  // 3-3-recognizedaction-4
  statementTests('3-3-recognizedaction-4');

  // 3-3-recognizedaction-6
  statementTests('3-3-recognizedaction-6');
});
