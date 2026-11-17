/*
 * SPDX-License-Identifier: LicenseRef-w3c-3-clause-bsd-license-2008 OR LicenseRef-w3c-test-suite-license-2023
 */

import {setupStatementMatrix, statementTests} from '../statement-suite.js';
import {describe} from 'mocha';

// Spec section: 3.1 General Properties
describe('3.1 General Properties', function() {
  setupStatementMatrix(this);

  // 3-1-general-properties-2
  statementTests('3-1-general-properties-2');

  // 3-1-general-properties-3
  statementTests('3-1-general-properties-3');

  // 3-1-general-properties-4
  statementTests('3-1-general-properties-4');

  // 3-1-general-properties-5
  statementTests('3-1-general-properties-5');

  // 3-1-general-properties-6
  statementTests('3-1-general-properties-6');
});
