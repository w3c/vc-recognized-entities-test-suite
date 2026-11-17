/*
 * SPDX-License-Identifier: LicenseRef-w3c-3-clause-bsd-license-2008 OR LicenseRef-w3c-test-suite-license-2023
 */

import {setupStatementMatrix, statementTests} from '../statement-suite.js';
import {describe} from 'mocha';

// Spec section: 3.2 RecognizedEntity
describe('3.2 RecognizedEntity', function() {
  setupStatementMatrix(this);

  // 3-2-recognizedentity-1
  statementTests('3-2-recognizedentity-1');

  // 3-2-recognizedentity-2
  statementTests('3-2-recognizedentity-2');

  // 3-2-recognizedentity-3
  statementTests('3-2-recognizedentity-3');

  // 3-2-recognizedentity-5
  statementTests('3-2-recognizedentity-5');
});
