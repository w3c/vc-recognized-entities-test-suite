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

The test DIDs are `did:key` identifiers, and the credentials use the test
context `https://anchor.example/contexts/recognized-entities-test/v1`. Your
verifier needs to resolve both without network access to `anchor.example`.
