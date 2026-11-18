/*
 * SPDX-License-Identifier: LicenseRef-w3c-3-clause-bsd-license-2008 OR LicenseRef-w3c-test-suite-license-2023
 */

import {filterByTag} from 'vc-test-suite-implementations';

// Verifiers tagged for this suite, from the registry and localConfig.cjs.
// Only verifiers carry the tag; see localConfig.example.cjs.
export const RECOGNIZED_ENTITIES_TAG = 'recognized-entities';

export function taggedVerifiers() {
  const {match} = filterByTag({
    tags: [RECOGNIZED_ENTITIES_TAG],
    property: 'verifiers'
  });
  return match;
}

// Names of the tagged implementations, for matrix columns.
export function implementationNames() {
  return [...taggedVerifiers().keys()];
}

// Map of implementation name to the verify endpoint URL, from the `endpoint`
// field on the implementation's verifier entry.
export function endpointUrls() {
  const urls = new Map();
  for(const [name, implementation] of taggedVerifiers()) {
    const verifier = implementation.settings.verifiers.find(v => v.endpoint);
    urls.set(name, verifier?.endpoint);
  }
  return urls;
}

// Map of implementation name to the exchange URL the suite POSTs {} to. The
// URL is the `exchange` field on the implementation's verifier entry. Missing
// entries map to undefined.
// Map of implementation name to the issuer exchange URL: the issuerExchange
// field on the implementation's verifier entry. Its POST {} returns a
// presentation from the issuer side. Missing entries map to undefined.
export function issuerExchangeUrls() {
  const urls = new Map();
  for(const [name, implementation] of taggedVerifiers()) {
    const verifier = implementation.settings.verifiers.find(
      v => v.issuerExchange);
    urls.set(name, verifier?.issuerExchange);
  }
  return urls;
}

// Map of implementation name to the verifier exchange URL: the
// verifierExchange field on the implementation's verifier entry. The suite
// participates in it with a presentation. Missing entries map to undefined.
export function verifierExchangeUrls() {
  const urls = new Map();
  for(const [name, implementation] of taggedVerifiers()) {
    const verifier = implementation.settings.verifiers.find(
      v => v.verifierExchange);
    urls.set(name, verifier?.verifierExchange);
  }
  return urls;
}

export function exchangeUrls() {
  const urls = new Map();
  for(const [name, implementation] of taggedVerifiers()) {
    const verifier = implementation.settings.verifiers.find(v => v.exchange);
    urls.set(name, verifier?.exchange);
  }
  return urls;
}
