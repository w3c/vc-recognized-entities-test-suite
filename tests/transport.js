/*
 * SPDX-License-Identifier: LicenseRef-w3c-3-clause-bsd-license-2008 OR LicenseRef-w3c-test-suite-license-2023
 */

// How the suite reaches an implementation. This is a test-harness
// requirement, not part of the specification. Recognized Entities v1.0 defines
// the algorithms and their results (4.3, 4.4), but no request format, no
// endpoint, and no HTTP status codes. The suite needs some way to run the
// algorithm of 4.3 on an implementation, so it uses the one below. No test
// asserts on any of it: the status code and content type of a reply are never
// checked. A reply fails a test only if its body cannot be parsed as JSON.
//
// The request:
//   POST <endpoint>?action=<action>&evaluationDateTime=<dateTime>
//   body: a JSON presentation whose verifiableCredential array holds the
//     credential under test, then any recognized entity credentials the
//     holder supplies.
//
// The reply body, read as the outcome the spec defines:
//   - A result of 4.3 is a JSON object with the booleans recognized and
//     actionRecognized, and the lists errors and warnings.
//   - An error the algorithm raises (4.2, 4.3: "raise a <ERROR_TYPE>") is a
//     JSON object without a boolean recognized member. Its type member, if
//     any, is the error type URL.
//
// An optional second URL, exchange, returns documents the implementation
// publishes (POST with body {}). Only the 4-4-1-1-7 positive uses it. It is a
// suite contract, not spec.

import {EVALUATION_DATE_TIME} from './http.js';

export function presentationOf(...credentials) {
  return {
    '@context': ['https://www.w3.org/ns/credentials/v2'],
    type: ['VerifiablePresentation'],
    verifiableCredential: credentials
  };
}

async function parseJson(response, what) {
  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch(error) {
    throw new Error(`${what} did not return a JSON body: ${error.message}`);
  }
}

// Reads a reply body as {recognized, actionRecognized, errors, warnings}. A
// raised error becomes one item in errors, so a test sees "an error was
// reported" the same way whether the algorithm raised it or returned it.
export function outcomeOf(body) {
  const object = body !== null && typeof body === 'object' ? body : {};
  const errors = Array.isArray(object.errors) ? [...object.errors] : [];
  const warnings = Array.isArray(object.warnings) ? [...object.warnings] : [];
  if(typeof object.recognized !== 'boolean') {
    errors.push({type: object.type ?? null, detail: object.error});
  }
  return {
    recognized: object.recognized === true,
    actionRecognized: object.actionRecognized === true,
    errors,
    warnings
  };
}

// Runs recognition (4.3) on the credentials, for one action at one evaluation
// time, and returns the outcome.
export async function verify(endpoint, credentials,
  {action = 'issue', evaluationDateTime = EVALUATION_DATE_TIME} = {}) {
  const url = new URL(endpoint);
  url.searchParams.set('action', action);
  url.searchParams.set('evaluationDateTime', evaluationDateTime);
  const response = await fetch(url, {
    method: 'POST',
    headers: {'content-type': 'application/json'},
    body: JSON.stringify(presentationOf(...credentials))
  });
  return outcomeOf(await parseJson(response, `POST ${endpoint}`));
}

// Participates in an exchange (VCALM, Participate in an Exchange): POSTs
// {verifiablePresentation} to the exchange URL and returns the HTTP status.
export async function participate(exchange, credentials) {
  const response = await fetch(exchange, {
    method: 'POST',
    headers: {'content-type': 'application/json'},
    body: JSON.stringify({
      verifiablePresentation: presentationOf(...credentials)
    })
  });
  return {status: response.status};
}

// Suite contract, not spec: the documents an implementation publishes.
export async function publishedDocuments(exchange) {
  const response = await fetch(exchange, {
    method: 'POST',
    headers: {'content-type': 'application/json'},
    body: '{}'
  });
  return parseJson(response, `POST ${exchange}`);
}
