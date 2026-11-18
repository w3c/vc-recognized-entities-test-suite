# Specification 'vc-recognized-entities-test-suite'

This is the repository for vc-recognized-entities-test-suite. You're welcome to contribute! Let's make the Web rock our socks
off!

## Instructions for implementers

The suite tests verifiers. To add yours, add a verifier entry with the
`recognized-entities` tag and an `exchange` URL to your implementation in
[vc-test-suite-implementations](https://github.com/w3c/vc-test-suite-implementations),
or locally in `localConfig.cjs` at the root of this suite:

```js
module.exports = {
  settings: {},
  implementations: [{
    name: 'My verifier',
    verifiers: [{
      id: 'https://verifier.example/verifiers/z123',
      exchange: 'https://verifier.example/workflows/z456/exchanges/z789',
      tags: ['recognized-entities']
    }]
  }]
};
```

A verifier entry with the tag but no `exchange` is listed in the report, and
its tests are skipped.

### The `exchange` endpoint

The suite uses the `exchange` URL only as an endpoint. It does not need to
support the rest of a VCALM exchange: no workflow, exchange state, or
presentation request is used.

The suite sends each test case as its own request:

```http
POST <exchange>
Content-Type: application/json

{"verifiablePresentation": { ... }}
```

The body has the shape of the VCALM "Participate in an Exchange" request.

- **Many requests, one URL.** The suite posts many presentations to the same
  URL. Each must be judged on its own, as if it were the first.
- **The presentation.** It is signed by a test holder with an `eddsa-jcs-2022`
  `authentication` proof. Its `challenge` is a random value chosen by the
  suite, and its `domain` is the origin of the `exchange` URL. Its
  `verifiableCredential` holds a credential first, then the recognized entity
  credential that lists that credential's issuer.
- **The response.** Answer `200` when the presentation conforms to section 3
  of the specification, and `400` when it does not. The suite checks only the
  status code.

The test DIDs are `did:key` identifiers. The credentials use the
`https://www.w3.org/ns/credentials/v2` and
`https://www.w3.org/ns/credentials/examples/v2` contexts. The Recognized
Entities context is not published yet, so the examples context covers its
terms.

## Report

`npm test` writes the interoperability report to `reports/index.html` and
`reports/index.json`, using
[mocha-w3c-interop-reporter](https://github.com/digitalbazaar/mocha-w3c-interop-reporter).

The report uses its own templates in `templates/`, in place of the reporter's
built-in ones. They are loaded by the `test` script (`--require` and the
`metrics` and `matrix` reporter options):

- `templates/metrics.hbs` places each section's results under the
  specification's headings, in the order of its table of contents. A heading
  is shown only when it has results. A new section needs its own slot here,
  or its results appear under "Other Results".
- `templates/matrix.hbs` is the reporter's results table, with a short title
  for each row and the full statement, with its RFC 2119 keywords marked, on
  hover.
- `templates/register-helpers.cjs` holds the Handlebars helpers these
  templates use. The statement text of an at-risk row comes from `recordRow`
  in `tests/helpers.js`.

Two things are still open:

- The custom templates have not yet been checked with
  [canivc](https://canivc.com/), which reads the reports of the VC test
  suites. It needs to be confirmed that it still reads this suite's results.
- Some of these changes, such as the hover text and the keyword marking, may
  belong in the reporter itself, so that other suites can use them without
  their own templates.
