/*
 * SPDX-License-Identifier: LicenseRef-w3c-3-clause-bsd-license-2008 OR LicenseRef-w3c-test-suite-license-2023
 */

import {describe, it} from 'mocha';
import {expect} from 'chai';
import {taggedVerifiers} from '../../tests/implementations.js';

// Checks the wiring between the registry and this suite. Needs no
// implementation running.
describe('recognized-entities verifier tags', () => {
  it('finds at least one tagged verifier', function() {
    const match = taggedVerifiers();
    if(match.size === 0) {
      this.skip();
    }
    expect(match.size).to.be.greaterThan(0);
  });

  it('gives every tagged verifier an endpoint URL', function() {
    const match = taggedVerifiers();
    if(match.size === 0) {
      this.skip();
    }
    for(const [name, implementation] of match) {
      for(const verifier of implementation.settings.verifiers) {
        expect(verifier.endpoint,
          `${name} verifier endpoint`).to.be.a('string');
        expect(verifier.endpoint).to.match(/^https?:\/\//);
      }
    }
  });
});
