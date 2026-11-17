/*
 * SPDX-License-Identifier: LicenseRef-w3c-3-clause-bsd-license-2008 OR LicenseRef-w3c-test-suite-license-2023
 */

import * as makeFixtures from '../../scripts/make-fixtures.mjs';
import {CHECKS, subjectOf} from './recognized-entities.js';
import {describe, it} from 'mocha';
import {expect} from 'chai';

// Runs every shape check against the in-memory fixtures. The conforming
// document must pass every check. Each violation must fail the check for its
// own key.
const conforming = makeFixtures.base;

describe('shape fixtures', () => {
  for(const [key, check] of Object.entries(CHECKS)) {
    it(`conforming fixture passes ${key}`, () => {
      const subject = subjectOf(check.subject, conforming);
      expect(check.run(subject)).to.deep.equal([]);
    });

    it(`violation fixture fails ${key}`, () => {
      const mutate = makeFixtures.violations[key];
      expect(mutate, `no violation for ${key}`).to.be.a('function');
      const doc = structuredClone(makeFixtures.base);
      mutate(doc);
      const subject = subjectOf(check.subject, doc);
      expect(check.run(subject), key).to.not.deep.equal([]);
    });
  }
});
