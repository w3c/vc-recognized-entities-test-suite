# Recognized Entities Test Suite

Interoperability tests for [Recognized Entities v1.0](https://www.w3.org/TR/vc-recognized-entities-1.0/).

## Instructions for implementers

To run this suite against a verifier, the verifier must provide the items below.
The report marks a test as skipped when the verifier does not provide what it
needs, so a missing item shows up as a gap rather than a failure.

1. **Register the verifier** with the tag `recognized-entities`, in the registry
   or in `localConfig.cjs` (see `localConfig.example.cjs`). Each entry needs:
   - `endpoint`: the verify URL (below).
   - `exchange` (optional): the exchange-state URL (below). Suite contract,
     not spec. Only the 4-4-1-1-7 positive uses it; without it that cell is
     skipped.
2. **Trust the test anchor.** Add `did:key:z6Mkr4eb4pNsvCF8zQkqwKzeAQFsqEm6Kr3jRyAbkcoMaXKw`
   to `recognizedIssuers`. It is the public test anchor from `signed/keys.json`.
3. **Verify endpoint.** Accept the request described in "Test-harness
   requirement: invoking a verifier" below, and answer with a JSON body that
   carries the 4.3 result. The suite does not check status codes or content
   types.
4. **Exchange state (optional, suite contract, not spec).** Accept
   `POST {exchange}` with body `{}` and answer with a JSON VerifiablePresentation.
   Its first credential is the credential under test, and the next are the
   recognized entity credentials it publishes.
5. **Credential validators.** Run each `credentialValidator` against the
   credential it applies to (section 4.3: each intermediate list, then the
   credential under test), with the options `chain`, `action`, and
   `evaluationDateTime`:
   - JSON Schema validators whose `id` is an inline `data:` URL
     (`application/schema+json`).
   - JavaScript validators whose `id` is an inline `data:` URL
     (`text/javascript`). Run them in a sandbox with no network, no host state,
     no other modules, a fresh runtime per run, and a time and memory limit
     (section 4.4.1 of the specification). Call the default export as
     `validate(credential, options)` and await a returned promise. A validator
     that does not recognize an option must throw an error whose `type` is
     `https://www.w3.org/TR/vc-data-model#UNRECOGNIZED_OPTION_ERROR`.
   - A recognized action with no `credentialValidator` sets no constraint.
   - Set `actionRecognized` to false, and report the errors of 4.4 and 4.4.1,
     if any validator rejects the credential or cannot be applied.
6. **Proofs.** Verify `eddsa-jcs-2022` proofs with `did:key`, using the test
   context `signed/recognized-entities-test-context.json` for the custom terms,
   on the credential under test and on every stapled list.
7. **Reading the report.** Each row is one statement. Each column is one
   implementation. A skipped cell means the verifier did not provide what the
   test needs, and the cell's reason is in the test code.

## Example implementation configuration

A verifier under test is described in two places, and the two must agree. The
example below uses the test verifier in the companion harness, with one local
verifier on port 8787.

**1. The suite's `localConfig.cjs`** (gitignored; start from
`localConfig.example.cjs`). This tells the suite where to send requests:

```js
module.exports = {
  settings: {testAllImplementations: true},
  implementations: [{
    name: 'Local verifier (example)',
    verifiers: [{
      id: 'http://localhost:8787/verifiers/recognized-entities',
      endpoint: 'http://localhost:8787/verifiers/recognized-entities/credentials/verify',
      exchange: 'http://localhost:8787/workflows/local-workflow/exchanges/local-exchange',
      tags: ['recognized-entities']
    }]
  }]
};
```

**2. The verifier's own config** (the harness's `config.json`). This tells the
verifier what to trust and what to publish:

```json
{
  "port": 8787,
  "recognizedIssuers": ["did:key:z6Mkr4eb4pNsvCF8zQkqwKzeAQFsqEm6Kr3jRyAbkcoMaXKw"],
  "maxDepth": 5,
  "testContextPath": "<suite>/tests/fixtures/recognized-entities/signed/recognized-entities-test-context.json",
  "subjectFiles": [
    "<suite>/tests/fixtures/recognized-entities/signed/known-issuer-credential.json",
    "<suite>/tests/fixtures/recognized-entities/signed/recognized-entity-credential.json"
  ]
}
```

Replace `<suite>` with the absolute path to the suite. Your implementation
reads its own configuration; these are the values that matter to the suite.

| Value | Where it is set | What the suite relies on |
|---|---|---|
| Verify URL | `endpoint` in `localConfig.cjs` | Must answer the request in `tests/transport.js` with a JSON body. |
| Exchange URL | `exchange` in `localConfig.cjs` | Optional, suite contract, not spec. Returns the published documents as a VerifiablePresentation. |
| Trusted anchor | `recognizedIssuers` in the verifier | Must include the test anchor DID, or every chain is refused. |
| Published documents | `subjectFiles` in the verifier | Decides what the exchange state shows. Only the 4-4-1-1-7 positive reads it. |

To run the suite against this verifier, start the verifier with its config,
then run `npm test` in the suite. Before a full run, `npm run preflight` checks
only that each verify endpoint can be reached and returns a JSON body, and exits
with a non-zero status if one cannot.

## Install

```sh
npm install
```

## Running the local verifier

The suite needs a verifier running at the `endpoint` and `exchange` in
`localConfig.cjs`. The verifier is the test harness in the Recognized Entities
harness repository (`scripts/verifier-server.js`).

1. Copy `verifier.config.example.json` to a file outside the repository, and
   replace every `/ABSOLUTE/PATH/TO/vc-recognized-entities-test-suite` with the
   absolute path to this suite. The harness reads these paths relative to its
   working directory, so they must be absolute.
2. From the harness repository, start the verifier:
   `node scripts/verifier-server.js --config <your-config-file>`. It listens on
   port 8787 and serves the verify endpoint and the exchange state.
3. From this suite, copy `localConfig.example.cjs` to `localConfig.cjs` if you
   haven't already, then run `npm run preflight` and `npm test`.

`maxDepth` and `maxDuration` are the verifier's own limits. The harness uses its
defaults when the config omits them.

## Usage

```sh
npm test            # the interop run: mocha over tests/**/*.spec.js
npm run test:tools  # self-tests of the suite's own tools (tools/**/*.spec.js)
npm run lint        # eslint
npm run scaffold  # regenerate tests/sections/ from tests/normative-statements.js
```

## Scope

Only MUST and REQUIRED statements are tested. SHOULD and MAY statements stay
in `tests/normative-statements.js` and `docs/statements-inventory.md`, with no
test. See the inventory for the status of every statement.

The interop run asserts only outcomes the spec defines: the 4.3 result
(`recognized`, `actionRecognized`, `errors`, `warnings`), the 4.4 validation
result, and the error types the spec names. It asserts no HTTP status code,
request format, media type, or problem type URL. Algorithm steps with no RFC
2119 keyword are not tested. Self-tests of the suite's checkers and its
bookkeeping (statement coverage, registry wiring) live in `tools/` and run with
`npm run test:tools`, outside the interop report.

## Implementations

Verifiers run this suite when they carry the tag `recognized-entities` in
their `verifiers` list. The tag is read by the
[vc-test-suite-implementations](https://github.com/w3c/vc-test-suite-implementations)
registry.

Implementations can be added two ways:

- **Registry:** a PR to the registry adds a tagged verifier entry, the same as
  for other suites.
- **Local:** copy `localConfig.example.cjs` to `localConfig.cjs` (gitignored)
  and list your verifier. With `testAllImplementations: true`, local and
  registry entries both run.

```js
verifiers: [{
  id: 'https://localhost:8443/verifiers/recognized-entities',
  endpoint: 'https://localhost:8443/verifiers/recognized-entities/credentials/verify',
  tags: ['recognized-entities']
}]
```

## Status

This suite targets the Recognized Entities v1.0 Working Draft of 15 November
2026 (https://www.w3.org/TR/vc-recognized-entities-1.0/), as fetched on
2026-11-17. The statement wording of sections 3.5 and 4.4 in
`tests/normative-statements.js` matches that draft (checked word for word on
2026-11-17). The statement list was generated from the TR, and the generator does
not record its version.

Each MUST/REQUIRED statement is one row in the report, and each tagged
implementation is a column. Each cell runs at least one positive and one
negative test (`tests/statement-suite.js`), collects every failure, and fails
once:

- **Accepted** means the result has `recognized` and `actionRecognized` both
  true and reports no error.
- **Refused** means the result is not recognized, or reports at least one
  error. Where the spec names the error type (for example
  `CREDENTIAL_VALIDATION_ERROR` for an unsupported `mediaType`, 4.4), the test
  checks that the type appears in `errors[].type`.
- Section 3 rows: the positive is the conforming anchor list, which the
  verifier must recognize; the negative is the same list with that one rule
  broken (1.1: the data model MUST be enforced).
- 1-1-conformance-2: every violation list must produce at least one error.
- 4.4 and 4.4.1 rows: suite-built validators whose code or output conforms
  (accepted) or breaks the statement (refused with the error 4.4.1 names).
- 4-4-1-1-7 is partial. The spec states no verifier behavior for a validator
  that reads other input, so the negative is the checker refusing validators
  that read the clock or random numbers, and the positive runs the validators
  the implementation publishes at its exchange URL (suite contract, not spec;
  the row text says so).

No REQUIRED statement depends on the evaluation date, so the suite has no
date-dependent test. 3-3-recognizedaction-4 and -6 are about the format of
`validFrom` and `validUntil`, and are tested as format violations.

## Test-harness requirement: invoking a verifier

This section is not normative. The spec defines no request format, endpoint,
or status code, but the suite needs one way to run 4.3 on an implementation.
All of it is in `tests/transport.js`, and no test asserts on it.

- **Request:** `POST {endpoint}?action={action}&evaluationDateTime={dateTime}`
  with a JSON body holding a Verifiable Presentation. Its `verifiableCredential`
  array holds the credential to verify, then any stapled recognized entity
  credentials.
- **Reply body:** JSON. A 4.3 result is an object with the booleans
  `recognized` and `actionRecognized` and the lists `errors` and `warnings`. An
  error the algorithm raises is an object without a boolean `recognized`; its
  `type` member, if any, is the error type URL. The status code and content
  type are ignored. A body that is not JSON fails the test.
- **Configured by the verifier:** `recognizedIssuers` (trust anchors),
  `maxDepth`, and `maxDuration`. The suite doesn't read these values.

The companion harness also answers with HTTP statuses (200, 403, 500, and 400
problem details for malformed requests) and its own problem type URLs. Those
are the harness's choices, not spec, and the suite does not test them.

## Exchange state (suite contract, not spec)

A verifier may also expose a static exchange state, `POST {exchange}` with body
`{}`, that returns a VerifiablePresentation of the documents it publishes: the
credential under test first, then the recognized entity credential. It is not a
VCALM exchange. Only the 4-4-1-1-7 positive uses it, to run the published
JavaScript validators in the sandbox (`tests/sandbox.js`). Without an
`exchange` entry, that cell is skipped after its negatives pass.

## Fixtures

Only the documents that implementers configure are files. Everything else is
signed or built in memory at run time, by `scripts/sign-fixtures.mjs` and
`scripts/make-fixtures.mjs`, and read by the tests through `tests/documents.js`.

Files in `tests/fixtures/recognized-entities/signed/`, written by
`node scripts/sign-fixtures.mjs`:

- `known-issuer-credential.json`: a credential from the test issuer, whose
  `recognizedIn` points at the anchor's credential. The verifier config names it
  in `subjectFiles`.
- `recognized-entity-credential.json`: the test anchor's credential, which lists
  the test issuer as a recognized entity. Named in `subjectFiles` too.
- `keys.json`: the public DIDs of the test anchor, issuer, and unknown issuer.
- `recognized-entities-test-context.json`: the JSON-LD context the verifier loads.
- Identifier files for the identifier code (not used by the interop run).

Built in memory per run (no file): the validator pairs, the conforming list, the
unknown-issuer credential, the shape violations (`violations` in
`scripts/make-fixtures.mjs`), and the credential violations of 3.2 signed by
`tests/chains.js`. All are signed with the fixed test keys.
`keys.json` lists the public DIDs. The keys are fixed, so implementers can add
the anchor DID to `recognizedIssuers` in advance. They are test keys derived from
public labels, not secrets. Regenerate with `node scripts/sign-fixtures.mjs`.

Signing uses JCS canonicalization, so it does not run JSON-LD and does not need
the context. The credentials still list `recognized-entities-test-context.json`
in `@context`, a stand-in for the spec's missing context (issue #73). A verifier
that validates the credential as JSON-LD must be able to load that context.

## Cryptosuite note

The signed fixtures use `eddsa-jcs-2022`, chosen for now because JCS canonicalization
does not run JSON-LD, so signing does not depend on a published context. Two
consequences:

- **Fewer implementations may support it.** Verifiers that support only
  `eddsa-rdfc-2022` or `ecdsa-rdfc-2019` will not pass these fixtures. The
  required-config section should say which cryptosuites a tagged verifier must
  support.
- **The context is still needed by JSON-LD verifiers.** The credentials list a
  stand-in context, and verifiers that validate as JSON-LD must load it until the
  spec publishes one (issue #73).
