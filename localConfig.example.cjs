// Copy to localConfig.cjs and edit. localConfig.cjs is gitignored.
//
// The vc-test-suite-implementations registry reads localConfig.cjs from this
// suite's root. Local implementations are added to the registry's remote ones.
// With `testAllImplementations: true`, both run. With it false or unset, only
// the local entries run.
//
// Tag `recognized-entities` on a verifier runs this suite against that
// verifier's endpoint. Only verifiers carry the tag; issuers and holders do
// not.
module.exports = {
  settings: {
    testAllImplementations: true
  },
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
