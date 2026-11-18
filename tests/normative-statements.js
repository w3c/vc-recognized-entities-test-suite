/*
 * SPDX-License-Identifier: LicenseRef-w3c-3-clause-bsd-license-2008 OR LicenseRef-w3c-test-suite-license-2023
 */

// Generated from the spec TR by respec-normative-statements. Do not edit.
// NORMATIVE: every spec sentence with an RFC 2119 keyword in an
// <em class="rfc2119"> element, keyed by section.
// SECTION: key -> spec section heading.
// REQUIRED: keys whose sentence contains MUST or REQUIRED (matrix rows).
// MARKED: keys the TR marks as normative with the rfc2119 class.

export const NORMATIVE = {
  // 1.1 Conformance
  '1-1-conformance-1':
    'Specifically, all relevant normative statements in Section 3. Data ' +
    'Model of this document MUST be enforced.',
  // 1.1 Conformance
  '1-1-conformance-2':
    'Conforming processors MUST produce errors when non-conforming ' +
    'documents are consumed.',
  // 3.1 General Properties
  '3-1-general-properties-1':
    'Each general property listed in this section is OPTIONAL;',
  // 3.1 General Properties
  '3-1-general-properties-2':
    'The type property MUST be RecognizedIssuer if the entity is an issuer ' +
    'of verifiable credentials.',
  // 3.1 General Properties
  '3-1-general-properties-3':
    'The value MUST be a one or more strings or language value objects, as ' +
    'described in Section 11.1: Language and Base Direction of the ' +
    'Verifiable Credentials Data Model v2.0 specification.',
  // 3.1 General Properties
  '3-1-general-properties-4':
    'The value MUST be a URL, which includes values using the data: URL ' +
    'scheme as described in [RFC2397].',
  // 3.1 General Properties
  '3-1-general-properties-5':
    'The value MUST be a URL.',
  // 3.1 General Properties
  '3-1-general-properties-6':
    'Each value MUST be a URL.',
  // 3.2 RecognizedEntity
  '3-2-recognizedentity-1':
    'The type property MUST be RecognizedEntity.',
  // 3.2 RecognizedEntity
  '3-2-recognizedentity-2':
    'The id value of the object MUST be a URL.',
  // 3.2 RecognizedEntity
  '3-2-recognizedentity-3':
    'The type value of the object MUST conform to the type value space ' +
    'defined in the Verifiable Credentials Data Model v2.0 specification ' +
    'and SHOULD be ExternalEntityList or RecognizedEntityCredential.',
  // 3.2 RecognizedEntity
  '3-2-recognizedentity-4':
    'A recognizedIn entry with a type property value of ExternalEntityList ' +
    'SHOULD conform to a valid entity list specification.',
  // 3.2 RecognizedEntity
  '3-2-recognizedentity-5':
    'A list with a type property value of RecognizedEntityCredential MUST ' +
    'conform to Recognized Entities v1.0.',
  // 3.3 RecognizedAction
  '3-3-recognizedaction-1':
    'The type property MUST be RecognizedAction.',
  // 3.3 RecognizedAction
  '3-3-recognizedaction-2':
    'The value of the credentialValidator property MUST be one or more ' +
    'credential validators, as defined in Section 3.5 Credential ' +
    'Validators, that provide verifiers with enough information to ' +
    'determine whether a verifiable credential produced by the recognized ' +
    'entity meets the constraints of the recognizing authority.',
  // 3.3 RecognizedAction
  '3-3-recognizedaction-3':
    'If more than one credential validator is present, the verifiable ' +
    'credential MUST satisfy every one of them.',
  // 3.3 RecognizedAction
  '3-3-recognizedaction-4':
    'The value MUST be an XML Schema dateTime value expressed in UTC with ' +
    'no sub-second precision, for example 2025-01-01T00:00:00Z.',
  // 3.3 RecognizedAction
  '3-3-recognizedaction-5':
    'This property is OPTIONAL;',
  // 3.3 RecognizedAction
  '3-3-recognizedaction-6':
    'The value MUST be an XML Schema dateTime value expressed in UTC with ' +
    'no sub-second precision, for example 2030-01-01T00:00:00Z.',
  // 3.3 RecognizedAction
  '3-3-recognizedaction-7':
    'This property is OPTIONAL;',
  // 3.4 RecognizedEntityCredential
  '3-4-recognizedentitycredential-1':
    'When a recognized entity credential is published, it MUST be a ' +
    'conforming verifiable credential, as defined in Verifiable Credentials ' +
    'Data Model v2.0, that expresses the data model specified in the ' +
    'section that follows.',
  // 3.4 RecognizedEntityCredential
  '3-4-recognizedentitycredential-2':
    'A verifiable credential that contains a set of recognized entities MAY ' +
    'express an id property to make its retrieval easier for other systems.',
  // 3.4 RecognizedEntityCredential
  '3-4-recognizedentitycredential-3':
    'A verifiable credential that contains a set of recognized entities ' +
    'MUST express a type property that includes the ' +
    'RecognizedEntityCredential value.',
  // 3.4 RecognizedEntityCredential
  '3-4-recognizedentitycredential-4':
    'This object, whose type is RecognizedIssuer, MAY also include other ' +
    'properties listed in Section 3.1 General Properties.',
  // 3.4 RecognizedEntityCredential
  '3-4-recognizedentitycredential-5':
    'This object MAY include a recognizedIn property, as defined in Section ' +
    '3.2 RecognizedEntity, that references a document of recognized ' +
    'entities in which the issuer itself appears;',
  // 3.5 Credential Validators
  '3-5-credential-validators-1':
    'The id property is REQUIRED.',
  // 3.5 Credential Validators
  '3-5-credential-validators-2':
    'Its value MUST be a URL that links to the file used to validate the ' +
    'verifiable credential.',
  // 3.5 Credential Validators
  '3-5-credential-validators-3':
    'The value MAY be a data: URL, as described in [RFC2397], that embeds ' +
    'the file.',
  // 3.5 Credential Validators
  '3-5-credential-validators-4':
    'The type property MUST be CredentialValidator.',
  // 3.5 Credential Validators
  '3-5-credential-validators-5':
    'The mediaType property is REQUIRED.',
  // 3.5 Credential Validators
  '3-5-credential-validators-6':
    'A credential validator SHOULD provide a cryptographic hash of the file ' +
    'identified by id, using one of the mechanisms described in Section ' +
    '5.3: Integrity of Related Resources of the Verifiable Credentials Data ' +
    'Model v2.0 specification.',
  // 4. Algorithms
  '4-algorithms-1':
    'A verifier MAY use any other mechanism, including receiving the ' +
    'recognized entity credentials directly from a holder as described in ' +
    'Section D.3 Holder-Based Delivery.',
  // 4.1 Credential-based Discovery
  '4-1-credential-based-discovery-1':
    'A holder MAY pre-fetch the recognized entity credentials along this ' +
    'hierarchy and provide them to the verifier alongside the verifiable ' +
    'credential, using the "certificate stapling" mechanism described in ' +
    'Section 3.4 RecognizedEntityCredential.',
  // 4.1 Credential-based Discovery
  '4-1-credential-based-discovery-2':
    'A verifier that requires more recent information MAY reject the ' +
    'holder-provided verifiable credentials or ignore them and fetch the ' +
    'recognized entity credentials directly.',
  // 4.2 Identifier-based Discovery
  '4-2-identifier-based-discovery-1':
    'That document MAY declare a service whose type array includes both ' +
    'WhoisService and PathService;',
  // 4.2 Identifier-based Discovery
  '4-2-identifier-based-discovery-2':
    'Among these MAY be a recognized entity credential in which the issuer ' +
    'appears as a recognized entity.',
  // 4.2 Identifier-based Discovery
  '4-2-identifier-based-discovery-3':
    'If it does not, and the recognized entity credential carries a ' +
    'recognizedIn property on its own issuer object, the verifier MAY ' +
    'continue with credential-based discovery to traverse the recognition ' +
    'hierarchy until it reaches an issuer it recognizes.',
  // 4.4 Credential Validation
  '4-4-credential-validation-1':
    'Other specifications MAY define additional options.',
  // 4.4 Credential Validation
  '4-4-credential-validation-2':
    'A credential validator MUST throw an UNRECOGNIZED_OPTION_ERROR if it ' +
    'does not recognize an option.',
  // 4.4.1 JavaScript Validator Processing
  '4-4-1-javascript-validator-processing-1':
    'A verifier MAY use an algorithm other than the one below if its ' +
    'security and privacy outcomes, and its result, are the same.',
  // 4.4.1 JavaScript Validator Processing
  '4-4-1-javascript-validator-processing-2':
    'The validator code MUST be an ECMAScript module, as defined in ' +
    '[ECMASCRIPT], whose default export is a function.',
  // 4.4.1 JavaScript Validator Processing
  '4-4-1-javascript-validator-processing-3':
    'A sandbox that runs validator code SHOULD meet the following security ' +
    'requirements.',
  // 4.4.1.1 JavaScript Credential Validation Function
  '4-4-1-1-javascript-credential-validation-function-1':
    'The function MAY be asynchronous, in which case it returns a promise ' +
    'that resolves to result.',
  // 4.4.1.1 JavaScript Credential Validation Function
  '4-4-1-1-javascript-credential-validation-function-2':
    'valid REQUIRED. A boolean that is true if credential meets the ' +
    'constraints that the validator code checks, and false otherwise.',
  // 4.4.1.1 JavaScript Credential Validation Function
  '4-4-1-1-javascript-credential-validation-function-3':
    'errors OPTIONAL. An array of ProblemDetails objects, each describing a ' +
    'constraint that credential does not meet.',
  // 4.4.1.1 JavaScript Credential Validation Function
  '4-4-1-1-javascript-credential-validation-function-4':
    'If valid is true, this array MUST be empty or absent.',
  // 4.4.1.1 JavaScript Credential Validation Function
  '4-4-1-1-javascript-credential-validation-function-5':
    'warnings OPTIONAL. An array of ProblemDetails objects, each describing ' +
    'a condition that a verifier might want to know about but that does not ' +
    'cause validation to fail.',
  // 4.4.1.1 JavaScript Credential Validation Function
  '4-4-1-1-javascript-credential-validation-function-6':
    'Each item in errors and warnings MUST conform to Section 7.1.4: ' +
    'Problem Details of the Verifiable Credentials Data Model v2.0 ' +
    'specification.',
  // 4.4.1.1 JavaScript Credential Validation Function
  '4-4-1-1-javascript-credential-validation-function-7':
    'The validation function MUST NOT depend on any input other than ' +
    'credential and options.',
  // 4.5 Errors
  '4-5-errors-1':
    'The URL that was being retrieved SHOULD be provided in the ' +
    'ProblemDetails object.',
  // 4.5 Errors
  '4-5-errors-2':
    'The limit that was exceeded SHOULD be identified in the ProblemDetails ' +
    'object.',
  // 4.5 Errors
  '4-5-errors-3':
    'When a time limit runs out during a retrieval, the URL being retrieved ' +
    'SHOULD be provided as well.',
  // 4.5 Errors
  '4-5-errors-4':
    'The name of the option SHOULD be provided in the ProblemDetails ' +
    'object.',
};

export const SECTION = {
  '1-1-conformance-1':
    '1.1 Conformance',
  '1-1-conformance-2':
    '1.1 Conformance',
  '3-1-general-properties-1':
    '3.1 General Properties',
  '3-1-general-properties-2':
    '3.1 General Properties',
  '3-1-general-properties-3':
    '3.1 General Properties',
  '3-1-general-properties-4':
    '3.1 General Properties',
  '3-1-general-properties-5':
    '3.1 General Properties',
  '3-1-general-properties-6':
    '3.1 General Properties',
  '3-2-recognizedentity-1':
    '3.2 RecognizedEntity',
  '3-2-recognizedentity-2':
    '3.2 RecognizedEntity',
  '3-2-recognizedentity-3':
    '3.2 RecognizedEntity',
  '3-2-recognizedentity-4':
    '3.2 RecognizedEntity',
  '3-2-recognizedentity-5':
    '3.2 RecognizedEntity',
  '3-3-recognizedaction-1':
    '3.3 RecognizedAction',
  '3-3-recognizedaction-2':
    '3.3 RecognizedAction',
  '3-3-recognizedaction-3':
    '3.3 RecognizedAction',
  '3-3-recognizedaction-4':
    '3.3 RecognizedAction',
  '3-3-recognizedaction-5':
    '3.3 RecognizedAction',
  '3-3-recognizedaction-6':
    '3.3 RecognizedAction',
  '3-3-recognizedaction-7':
    '3.3 RecognizedAction',
  '3-4-recognizedentitycredential-1':
    '3.4 RecognizedEntityCredential',
  '3-4-recognizedentitycredential-2':
    '3.4 RecognizedEntityCredential',
  '3-4-recognizedentitycredential-3':
    '3.4 RecognizedEntityCredential',
  '3-4-recognizedentitycredential-4':
    '3.4 RecognizedEntityCredential',
  '3-4-recognizedentitycredential-5':
    '3.4 RecognizedEntityCredential',
  '3-5-credential-validators-1':
    '3.5 Credential Validators',
  '3-5-credential-validators-2':
    '3.5 Credential Validators',
  '3-5-credential-validators-3':
    '3.5 Credential Validators',
  '3-5-credential-validators-4':
    '3.5 Credential Validators',
  '3-5-credential-validators-5':
    '3.5 Credential Validators',
  '3-5-credential-validators-6':
    '3.5 Credential Validators',
  '4-algorithms-1':
    '4. Algorithms',
  '4-1-credential-based-discovery-1':
    '4.1 Credential-based Discovery',
  '4-1-credential-based-discovery-2':
    '4.1 Credential-based Discovery',
  '4-2-identifier-based-discovery-1':
    '4.2 Identifier-based Discovery',
  '4-2-identifier-based-discovery-2':
    '4.2 Identifier-based Discovery',
  '4-2-identifier-based-discovery-3':
    '4.2 Identifier-based Discovery',
  '4-4-credential-validation-1':
    '4.4 Credential Validation',
  '4-4-credential-validation-2':
    '4.4 Credential Validation',
  '4-4-1-javascript-validator-processing-1':
    '4.4.1 JavaScript Validator Processing',
  '4-4-1-javascript-validator-processing-2':
    '4.4.1 JavaScript Validator Processing',
  '4-4-1-javascript-validator-processing-3':
    '4.4.1 JavaScript Validator Processing',
  '4-4-1-1-javascript-credential-validation-function-1':
    '4.4.1.1 JavaScript Credential Validation Function',
  '4-4-1-1-javascript-credential-validation-function-2':
    '4.4.1.1 JavaScript Credential Validation Function',
  '4-4-1-1-javascript-credential-validation-function-3':
    '4.4.1.1 JavaScript Credential Validation Function',
  '4-4-1-1-javascript-credential-validation-function-4':
    '4.4.1.1 JavaScript Credential Validation Function',
  '4-4-1-1-javascript-credential-validation-function-5':
    '4.4.1.1 JavaScript Credential Validation Function',
  '4-4-1-1-javascript-credential-validation-function-6':
    '4.4.1.1 JavaScript Credential Validation Function',
  '4-4-1-1-javascript-credential-validation-function-7':
    '4.4.1.1 JavaScript Credential Validation Function',
  '4-5-errors-1':
    '4.5 Errors',
  '4-5-errors-2':
    '4.5 Errors',
  '4-5-errors-3':
    '4.5 Errors',
  '4-5-errors-4':
    '4.5 Errors',
};

export const REQUIRED = [
  '1-1-conformance-1',
  '1-1-conformance-2',
  '3-1-general-properties-2',
  '3-1-general-properties-3',
  '3-1-general-properties-4',
  '3-1-general-properties-5',
  '3-1-general-properties-6',
  '3-2-recognizedentity-1',
  '3-2-recognizedentity-2',
  '3-2-recognizedentity-3',
  '3-2-recognizedentity-5',
  '3-3-recognizedaction-1',
  '3-3-recognizedaction-2',
  '3-3-recognizedaction-3',
  '3-3-recognizedaction-4',
  '3-3-recognizedaction-6',
  '3-4-recognizedentitycredential-1',
  '3-4-recognizedentitycredential-3',
  '3-5-credential-validators-1',
  '3-5-credential-validators-2',
  '3-5-credential-validators-4',
  '3-5-credential-validators-5',
  '4-4-credential-validation-2',
  '4-4-1-javascript-validator-processing-2',
  '4-4-1-1-javascript-credential-validation-function-2',
  '4-4-1-1-javascript-credential-validation-function-4',
  '4-4-1-1-javascript-credential-validation-function-6',
  '4-4-1-1-javascript-credential-validation-function-7',
];

export const MARKED = [
  '1-1-conformance-1',
  '1-1-conformance-2',
  '3-1-general-properties-1',
  '3-1-general-properties-2',
  '3-1-general-properties-3',
  '3-1-general-properties-4',
  '3-1-general-properties-5',
  '3-1-general-properties-6',
  '3-2-recognizedentity-1',
  '3-2-recognizedentity-2',
  '3-2-recognizedentity-3',
  '3-2-recognizedentity-4',
  '3-2-recognizedentity-5',
  '3-3-recognizedaction-1',
  '3-3-recognizedaction-2',
  '3-3-recognizedaction-3',
  '3-3-recognizedaction-4',
  '3-3-recognizedaction-5',
  '3-3-recognizedaction-6',
  '3-3-recognizedaction-7',
  '3-4-recognizedentitycredential-1',
  '3-4-recognizedentitycredential-2',
  '3-4-recognizedentitycredential-3',
  '3-4-recognizedentitycredential-4',
  '3-4-recognizedentitycredential-5',
  '3-5-credential-validators-1',
  '3-5-credential-validators-2',
  '3-5-credential-validators-3',
  '3-5-credential-validators-4',
  '3-5-credential-validators-5',
  '3-5-credential-validators-6',
  '4-algorithms-1',
  '4-1-credential-based-discovery-1',
  '4-1-credential-based-discovery-2',
  '4-2-identifier-based-discovery-1',
  '4-2-identifier-based-discovery-2',
  '4-2-identifier-based-discovery-3',
  '4-4-credential-validation-1',
  '4-4-credential-validation-2',
  '4-4-1-javascript-validator-processing-1',
  '4-4-1-javascript-validator-processing-2',
  '4-4-1-javascript-validator-processing-3',
  '4-4-1-1-javascript-credential-validation-function-1',
  '4-4-1-1-javascript-credential-validation-function-2',
  '4-4-1-1-javascript-credential-validation-function-3',
  '4-4-1-1-javascript-credential-validation-function-4',
  '4-4-1-1-javascript-credential-validation-function-5',
  '4-4-1-1-javascript-credential-validation-function-6',
  '4-4-1-1-javascript-credential-validation-function-7',
  '4-5-errors-1',
  '4-5-errors-2',
  '4-5-errors-3',
  '4-5-errors-4',
];
