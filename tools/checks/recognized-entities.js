/*
 * SPDX-License-Identifier: LicenseRef-w3c-3-clause-bsd-license-2008 OR LicenseRef-w3c-test-suite-license-2023
 */

// Shape checks for MUST/REQUIRED statements that can be decided from one JSON
// object. Each check takes the object and returns a list of violations; an
// empty list means the statement holds for that object. Checks do not fetch
// anything, verify proofs, or depend on how an implementation is exercised.
//
// Statements that need verifier behavior (for example, that every credential
// validator is evaluated) or running validator code have no entry here.

const DATE_TIME_UTC = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/;
const VC_V2_CONTEXT = 'https://www.w3.org/ns/credentials/v2';

// Absolute URL with a scheme. DIDs also pass; see the statement notes.
export function isUrl(value) {
  if(typeof value !== 'string') {
    return false;
  }
  try {
    return new URL(value).protocol !== '';
  } catch(error) {
    return false;
  }
}

// XML Schema dateTime, UTC, no fractional seconds (e.g. 2025-01-01T00:00:00Z).
export function isUtcDateTimeNoFraction(value) {
  if(typeof value !== 'string' || !DATE_TIME_UTC.test(value)) {
    return false;
  }
  // Date.parse rolls over impossible days (2025-02-30), so compare the
  // round-trip string instead.
  const date = new Date(value);
  return !Number.isNaN(date.getTime()) &&
    date.toISOString() === value.replace('Z', '.000Z');
}

function types(obj) {
  return [].concat(obj?.type ?? []);
}

export function checkTypeIs(obj, expected) {
  return types(obj).includes(expected) ?
    [] :
    [`type must be ${expected}, found ${JSON.stringify(obj?.type)}`];
}

export function checkIdIsUrl(obj) {
  return isUrl(obj?.id) ?
    [] :
    [`id must be a URL, found ${JSON.stringify(obj?.id)}`];
}

// A type value is a non-empty string, or an array of non-empty strings.
export function checkTypeValue(obj) {
  const type = obj?.type;
  const ok = (typeof type === 'string' && type !== '') ||
    (Array.isArray(type) && type.length > 0 &&
      type.every(t => typeof t === 'string' && t !== ''));
  return ok ?
    [] :
    [`type must be a string or an array of strings, ` +
      `found ${JSON.stringify(type)}`];
}

// The credential validators of a recognized action, as an array. A single
// validator object counts as one.
export function validatorsOf(action) {
  const cv = action?.credentialValidator;
  if(cv === undefined || cv === null) {
    return [];
  }
  return Array.isArray(cv) ? cv : [cv];
}

// 3.3-2: when present, the credentialValidator property holds one or more
// validators. 3.3 does not make the property REQUIRED, so an action without
// it passes, and the statement test skips it (optionalProperty in CHECKS).
export function checkCredentialValidatorPresent(action) {
  if(action?.credentialValidator === undefined) {
    return [];
  }
  return validatorsOf(action).length > 0 ?
    [] :
    ['credentialValidator must contain one or more credential validators'];
}

// Each check below runs on the validators of one recognized action. With no
// validators there is nothing to check, so it is a violation, not a pass.
function eachValidator(validators, rule) {
  if(validators.length === 0) {
    return ['there is no credential validator to check'];
  }
  return validators.flatMap((validator, i) =>
    rule(validator).map(message => `credentialValidator[${i}]: ${message}`));
}

// 3.5-1: the id property is REQUIRED.
export function checkValidatorIdPresent(validators) {
  return eachValidator(validators, v => v?.id === undefined ?
    ['id is REQUIRED'] : []);
}

// 3.5-2: the id value MUST be a URL. A data: URL is also a URL.
export function checkValidatorIdIsUrl(validators) {
  return eachValidator(validators, v => isUrl(v?.id) ?
    [] : [`id must be a URL, found ${JSON.stringify(v?.id)}`]);
}

// 3.5-4: the type property MUST be CredentialValidator.
export function checkValidatorType(validators) {
  return eachValidator(validators, v => checkTypeIs(v, 'CredentialValidator'));
}

// 3.5-5: the mediaType property is REQUIRED, and is a string.
export function checkValidatorMediaType(validators) {
  return eachValidator(validators, v => typeof v?.mediaType === 'string' &&
    v.mediaType !== '' ?
    [] : ['mediaType is REQUIRED and must be a string']);
}

// 3.1 General Properties, optional values. The checks below run only when the
// property is present; the statement tests skip it when it is absent (see
// optionalProperty in CHECKS).

// legalName: a string, a language value object, or an array of either.
export function checkLegalName(issuer) {
  const values = [].concat(issuer?.legalName);
  const ok = values.every(v => (typeof v === 'string' && v !== '') ||
    (v !== null && typeof v === 'object' && typeof v['@value'] === 'string'));
  return ok ?
    [] :
    [`legalName must be a string or language value object, ` +
      `found ${JSON.stringify(issuer.legalName)}`];
}

// A single URL, such as image or url. A data: URL is also a URL.
export function checkUrlValue(obj, property) {
  return isUrl(obj?.[property]) ?
    [] :
    [`${property} must be a URL, found ${JSON.stringify(obj?.[property])}`];
}

// Every value of a property that may hold one or more URLs.
export function checkUrlValues(obj, property) {
  const values = [].concat(obj?.[property]);
  return values.every(isUrl) ?
    [] :
    [`${property} values must all be URLs, found ` +
      JSON.stringify(obj?.[property])];
}

// Optional property: absent is fine, present must be UTC dateTime, no
// fractional seconds.
export function checkOptionalDateTime(obj, property) {
  if(obj?.[property] === undefined) {
    return [];
  }
  return isUtcDateTimeNoFraction(obj[property]) ?
    [] :
    [`${property} must be a UTC XML Schema dateTime with no fractional ` +
      `seconds, found ${JSON.stringify(obj[property])}`];
}

// 3.4-1: a published recognized entity credential is a conforming VC Data
// Model v2.0 credential. This checks the structure only: the v2 context, the
// VerifiableCredential type, an issuer, and credentialSubject. It does not
// verify the data model in full, and it does not check the proof.
export function checkVcV2Structure(vc) {
  const violations = [];
  if(!Array.isArray(vc?.['@context']) || vc['@context'][0] !== VC_V2_CONTEXT) {
    violations.push(`@context must start with ${VC_V2_CONTEXT}`);
  }
  if(!types(vc).includes('VerifiableCredential')) {
    violations.push('type must include VerifiableCredential');
  }
  const issuer = vc?.issuer;
  const issuerOk = (typeof issuer === 'string' && issuer !== '') ||
    (typeof issuer?.id === 'string' && issuer.id !== '');
  if(!issuerOk) {
    violations.push('issuer is required, as a string or an object with an id');
  }
  const subject = vc?.credentialSubject;
  if(!(subject !== null && typeof subject === 'object' &&
    (!Array.isArray(subject) || subject.length > 0))) {
    violations.push('credentialSubject is required');
  }
  if(vc?.validFrom !== undefined && typeof vc.validFrom !== 'string') {
    violations.push('validFrom must be a string when present');
  }
  return violations;
}

// Subjects whose checks apply to every part of a recognized entity credential.
const LIST_SUBJECTS = new Set([
  'recognizedEntity', 'recognizedAction', 'credentialValidators', 'credential',
  'recognizedIssuer'
]);

// True when a check has something to check on the subject: a check on an
// OPTIONAL property does not apply when the property is absent.
export function checkApplies(check, subject) {
  return !(check.optionalProperty &&
    subject?.[check.optionalProperty] === undefined);
}

// 3.2-5: a list typed RecognizedEntityCredential conforms to Recognized
// Entities v1.0. This runs every check that applies to the list's own parts,
// so it covers the list's entity, action, validators, and credential. It
// checks the first credentialSubject only, and skips absent OPTIONAL
// properties.
export function checkListConforms(list, checks) {
  return Object.entries(checks)
    .filter(([, check]) => LIST_SUBJECTS.has(check.subject))
    .flatMap(([key, check]) => {
      const subject = subjectOf(check.subject, list);
      if(!checkApplies(check, subject)) {
        return [];
      }
      return check.run(subject).map(message => `${key}: ${message}`);
    });
}

// Maps statement key -> the object kind it applies to and the check to run.
// Each check runs on the subject kind named in `subject`; see subjectOf().
export const CHECKS = {
  // 3.1 General Properties: legalName, image, url, sameAs (optional values).
  '3-1-general-properties-3': {
    subject: 'recognizedIssuer',
    optionalProperty: 'legalName',
    run: issuer => checkLegalName(issuer)
  },
  '3-1-general-properties-4': {
    subject: 'recognizedIssuer',
    optionalProperty: 'image',
    run: issuer => checkUrlValue(issuer, 'image')
  },
  '3-1-general-properties-5': {
    subject: 'recognizedIssuer',
    optionalProperty: 'url',
    run: issuer => checkUrlValue(issuer, 'url')
  },
  '3-1-general-properties-6': {
    subject: 'recognizedIssuer',
    optionalProperty: 'sameAs',
    run: issuer => checkUrlValues(issuer, 'sameAs')
  },
  // 3.1 General Properties: "The type property MUST be RecognizedIssuer if
  // the entity is an issuer of verifiable credentials." Applied to the issuer
  // object of the recognized entity credential (the anchor). See the note in
  // the project memory on this reading.
  '3-1-general-properties-2': {
    subject: 'recognizedIssuer',
    run: issuer => checkTypeIs(issuer, 'RecognizedIssuer')
  },
  // 3.2 RecognizedEntity: "The type property MUST be RecognizedEntity."
  '3-2-recognizedentity-1': {
    subject: 'recognizedEntity',
    run: entity => checkTypeIs(entity, 'RecognizedEntity')
  },
  // 3.2 RecognizedEntity, dfn-recognizedin: "The id value of the object MUST
  // be a URL." Assumes the object is a recognizedIn entry. Confirm with the
  // spec editors before relying on this.
  '3-2-recognizedentity-2': {
    subject: 'recognizedIn',
    run: entry => checkIdIsUrl(entry)
  },
  // 3.2 RecognizedEntity: "The type value of the object MUST conform to the
  // type value space ... ". Same assumption as 3-2-recognizedentity-2: the
  // object is a recognizedIn entry. The SHOULD is not checked.
  '3-2-recognizedentity-3': {
    subject: 'recognizedIn',
    run: entry => checkTypeValue(entry)
  },
  // 3.2 RecognizedEntity: "A list with a type property value of
  // RecognizedEntityCredential MUST conform to Recognized Entities v1.0."
  '3-2-recognizedentity-5': {
    subject: 'recognizedEntityCredential',
    run: list => checkListConforms(list, CHECKS)
  },
  // 3.3 RecognizedAction: "The type property MUST be RecognizedAction."
  '3-3-recognizedaction-1': {
    subject: 'recognizedAction',
    run: action => checkTypeIs(action, 'RecognizedAction')
  },
  // 3.3 RecognizedAction: credentialValidator MUST be one or more validators.
  // The property is not REQUIRED, so the statement applies only when present.
  '3-3-recognizedaction-2': {
    subject: 'recognizedAction',
    optionalProperty: 'credentialValidator',
    run: action => checkCredentialValidatorPresent(action)
  },
  // 3.3 RecognizedAction: validFrom MUST be UTC dateTime, no sub-seconds.
  '3-3-recognizedaction-4': {
    subject: 'recognizedAction',
    optionalProperty: 'validFrom',
    run: action => checkOptionalDateTime(action, 'validFrom')
  },
  // 3.3 RecognizedAction: validUntil MUST be UTC dateTime, no sub-seconds.
  '3-3-recognizedaction-6': {
    subject: 'recognizedAction',
    optionalProperty: 'validUntil',
    run: action => checkOptionalDateTime(action, 'validUntil')
  },
  // 3.4 RecognizedEntityCredential: the credential's type includes
  // RecognizedEntityCredential.
  '3-4-recognizedentitycredential-3': {
    subject: 'credential',
    run: credential => checkTypeIs(credential, 'RecognizedEntityCredential')
  },
  // 3.4 RecognizedEntityCredential: "it MUST be a conforming verifiable
  // credential" (structure only; see checkVcV2Structure).
  '3-4-recognizedentitycredential-1': {
    subject: 'credential',
    run: credential => checkVcV2Structure(credential)
  },
  // 3.5 CredentialValidator: the id, type and mediaType properties.
  '3-5-credential-validators-1': {
    subject: 'credentialValidators',
    run: validators => checkValidatorIdPresent(validators)
  },
  '3-5-credential-validators-2': {
    subject: 'credentialValidators',
    run: validators => checkValidatorIdIsUrl(validators)
  },
  '3-5-credential-validators-4': {
    subject: 'credentialValidators',
    run: validators => checkValidatorType(validators)
  },
  '3-5-credential-validators-5': {
    subject: 'credentialValidators',
    run: validators => checkValidatorMediaType(validators)
  }
};

// Picks the object a check applies to out of a credential. Kinds match the
// `subject` values in CHECKS.
export function subjectOf(kind, credential) {
  switch(kind) {
    case 'recognizedEntity':
      return credential?.credentialSubject?.[0];
    case 'recognizedIn':
      return credential?.issuer?.recognizedIn;
    case 'recognizedIssuer':
      return credential?.issuer;
    case 'recognizedAction':
      return credential?.credentialSubject?.[0]?.recognizedTo;
    case 'credentialValidators':
      return validatorsOf(credential?.credentialSubject?.[0]?.recognizedTo);
    case 'recognizedEntityCredential':
    case 'credential':
      return credential;
    default:
      return undefined;
  }
}
