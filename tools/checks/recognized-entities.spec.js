/*
 * SPDX-License-Identifier: LicenseRef-w3c-3-clause-bsd-license-2008 OR LicenseRef-w3c-test-suite-license-2023
 */

import {
  checkApplies, checkCredentialValidatorPresent, checkIdIsUrl,
  checkListConforms, checkOptionalDateTime, CHECKS,
  checkTypeIs, checkTypeValue, checkValidatorIdIsUrl, checkValidatorIdPresent,
  checkValidatorMediaType, checkValidatorType, checkVcV2Structure, isUrl,
  isUtcDateTimeNoFraction
} from './recognized-entities.js';
import {describe, it} from 'mocha';
import {expect} from 'chai';

// Unit tests for the checkers themselves, using inline samples. These run
// without an implementation.

const validator = {
  type: 'CredentialValidator',
  id: 'https://learning-commission.example/credentials/bachelors.json',
  mediaType: 'application/schema+json'
};
const action = {
  type: 'RecognizedAction',
  action: 'issue',
  credentialValidator: validator,
  validFrom: '2025-01-01T00:00:00Z',
  validUntil: '2030-01-01T00:00:00Z'
};
const vcV2 = {
  '@context': ['https://www.w3.org/ns/credentials/v2'],
  type: ['VerifiableCredential', 'RecognizedEntityCredential'],
  issuer: 'did:example:anchor',
  credentialSubject: [{id: 'did:example:issuer'}]
};

describe('recognized entities checkers', () => {
  describe('isUrl', () => {
    it('accepts absolute URLs', () => {
      expect(isUrl('https://example.org/a.json')).to.be.true;
    });
    it('rejects relative paths and non-strings', () => {
      expect(isUrl('/a.json')).to.be.false;
      expect(isUrl(42)).to.be.false;
      expect(isUrl(undefined)).to.be.false;
    });
  });

  describe('isUtcDateTimeNoFraction', () => {
    it('accepts UTC dateTime without fractional seconds', () => {
      expect(isUtcDateTimeNoFraction('2025-01-01T00:00:00Z')).to.be.true;
    });
    it('rejects fractional seconds, offsets, and missing Z', () => {
      expect(isUtcDateTimeNoFraction('2025-01-01T00:00:00.5Z')).to.be.false;
      expect(isUtcDateTimeNoFraction('2025-01-01T00:00:00+01:00')).to.be.false;
      expect(isUtcDateTimeNoFraction('2025-01-01T00:00:00')).to.be.false;
    });
    it('rejects impossible dates', () => {
      expect(isUtcDateTimeNoFraction('2025-02-30T00:00:00Z')).to.be.false;
    });
  });

  describe('checkTypeIs (3.2-1, 3.3-1, 3.4-3)', () => {
    it('passes when the type matches', () => {
      expect(checkTypeIs({type: 'RecognizedAction'}, 'RecognizedAction'))
        .to.deep.equal([]);
    });
    it('passes when the type is an array containing the value', () => {
      expect(checkTypeIs(
        {type: ['VerifiableCredential', 'RecognizedEntityCredential']},
        'RecognizedEntityCredential')).to.deep.equal([]);
    });
    it('reports a mismatch', () => {
      expect(checkTypeIs({type: 'RecognizedIssuer'}, 'RecognizedEntity'))
        .to.have.lengthOf(1);
    });
  });

  describe('checkIdIsUrl (3.2-2)', () => {
    it('passes for a URL id', () => {
      expect(checkIdIsUrl({id: 'https://example.org/x'})).to.deep.equal([]);
    });
    it('reports a non-URL id', () => {
      expect(checkIdIsUrl({id: 'not a url'})).to.have.lengthOf(1);
    });
  });

  describe('checkTypeValue (3.2-3)', () => {
    it('passes for a string or an array of strings', () => {
      expect(checkTypeValue({type: 'RecognizedEntityCredential'}))
        .to.deep.equal([]);
      expect(checkTypeValue({type: ['ExternalEntityList', 'X']}))
        .to.deep.equal([]);
    });
    it('reports a missing, empty, or non-string type', () => {
      expect(checkTypeValue({})).to.have.lengthOf(1);
      expect(checkTypeValue({type: ''})).to.have.lengthOf(1);
      expect(checkTypeValue({type: [42]})).to.have.lengthOf(1);
    });
  });

  describe('checkCredentialValidatorPresent (3.3-2)', () => {
    it('passes for one validator object', () => {
      expect(checkCredentialValidatorPresent(action)).to.deep.equal([]);
    });
    it('passes for an array of validators', () => {
      expect(checkCredentialValidatorPresent(
        {credentialValidator: [validator]})).to.deep.equal([]);
    });
    it('passes when credentialValidator is absent (not REQUIRED)', () => {
      expect(checkCredentialValidatorPresent({})).to.deep.equal([]);
    });
    it('reports a credentialValidator that holds no validator', () => {
      expect(checkCredentialValidatorPresent({credentialValidator: []}))
        .to.have.lengthOf(1);
      expect(checkCredentialValidatorPresent({credentialValidator: null}))
        .to.have.lengthOf(1);
    });
  });

  describe('credential validator properties (3.5-1, -2, -4, -5)', () => {
    const validators = [validator];
    it('passes for a validator with every REQUIRED property', () => {
      expect(checkValidatorIdPresent(validators)).to.deep.equal([]);
      expect(checkValidatorIdIsUrl(validators)).to.deep.equal([]);
      expect(checkValidatorType(validators)).to.deep.equal([]);
      expect(checkValidatorMediaType(validators)).to.deep.equal([]);
    });
    it('accepts a data: URL as the id', () => {
      expect(checkValidatorIdIsUrl([{...validator,
        id: 'data:text/plain,%7B%7D'}])).to.deep.equal([]);
    });
    it('reports each missing or wrong property', () => {
      expect(checkValidatorIdPresent([{type: 'CredentialValidator'}]))
        .to.have.lengthOf(1);
      expect(checkValidatorIdIsUrl([{id: 'schema.json'}]))
        .to.have.lengthOf(1);
      expect(checkValidatorType([{type: 'JsonSchema'}]))
        .to.have.lengthOf(1);
      expect(checkValidatorMediaType([{}])).to.have.lengthOf(1);
    });
    it('reports a missing validator, so there is nothing to pass', () => {
      expect(checkValidatorIdPresent([])).to.have.lengthOf(1);
    });
  });

  describe('checkVcV2Structure (3.4-1)', () => {
    it('passes for a v2 credential with context, type, issuer, subject', () => {
      expect(checkVcV2Structure(vcV2)).to.deep.equal([]);
    });
    it('reports a missing issuer, context, type or subject', () => {
      const noIssuer = {...vcV2};
      delete noIssuer.issuer;
      expect(checkVcV2Structure(noIssuer)).to.have.lengthOf(1);
      expect(checkVcV2Structure({...vcV2, '@context': ['https://x.example']}))
        .to.have.lengthOf(1);
      expect(checkVcV2Structure(
        {...vcV2, type: ['RecognizedEntityCredential']})).to.have.lengthOf(1);
      expect(checkVcV2Structure({...vcV2, credentialSubject: []}))
        .to.have.lengthOf(1);
    });
  });

  describe('optional properties (3.1, 3.3-2)', () => {
    const list = {
      ...vcV2,
      issuer: {id: 'did:example:anchor', type: 'RecognizedIssuer'},
      credentialSubject: [{
        id: 'did:example:issuer', type: 'RecognizedEntity',
        recognizedTo: {type: 'RecognizedAction', action: 'issue',
          credentialValidator: validator}
      }]
    };
    it('a check on an absent OPTIONAL property does not apply', () => {
      expect(checkApplies(CHECKS['3-1-general-properties-3'], list.issuer))
        .to.equal(false);
      expect(checkApplies(CHECKS['3-1-general-properties-3'],
        {legalName: 42})).to.equal(true);
      expect(checkApplies(CHECKS['3-3-recognizedaction-2'], {}))
        .to.equal(false);
    });
    it('a list without the OPTIONAL properties conforms (3.2-5)', () => {
      expect(checkListConforms(list, CHECKS)).to.deep.equal([]);
    });
    it('a list with a wrong OPTIONAL value does not conform (3.2-5)', () => {
      const bad = {...list, issuer: {...list.issuer, url: 'not a url'}};
      expect(checkListConforms(bad, CHECKS)).to.have.lengthOf(1);
    });
  });

  describe('checkOptionalDateTime (3.3-4, 3.3-6)', () => {
    it('passes when the property is absent (OPTIONAL)', () => {
      expect(checkOptionalDateTime({}, 'validFrom')).to.deep.equal([]);
    });
    it('passes for UTC dateTime with no fractional seconds', () => {
      expect(checkOptionalDateTime(action, 'validUntil'))
        .to.deep.equal([]);
    });
    it('reports fractional seconds', () => {
      expect(checkOptionalDateTime(
        {validFrom: '2025-01-01T00:00:00.123Z'}, 'validFrom'))
        .to.have.lengthOf(1);
    });
  });
});
