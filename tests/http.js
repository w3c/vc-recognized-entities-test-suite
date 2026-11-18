/*
 * SPDX-License-Identifier: LicenseRef-w3c-3-clause-bsd-license-2008 OR LicenseRef-w3c-test-suite-license-2023
 */

// Report links and the run-time evaluation date. Every test that needs a
// date uses NOW, which is set when the suite starts, so no test depends on a
// fixed calendar date.

export const TR = 'https://www.w3.org/TR/vc-recognized-entities-1.0/';

const DAY = 24 * 60 * 60 * 1000;
export const NOW = Date.now();
export const dateTime = ms => new Date(ms).toISOString().slice(0, 19) + 'Z';
export const EVALUATION_DATE_TIME = dateTime(NOW);
export const EARLIER = dateTime(NOW - 60 * DAY);
export const EXPIRES = dateTime(NOW - 30 * DAY);

// Requests to implementations are in transport.js.

// A link to the sentence in the TR, with a text fragment that highlights it.
export function textFragment(id, text) {
  const encoded = encodeURIComponent(text)
    .replace(/-/g, '%2D').replace(/,/g, '%2C');
  return `${TR}#${id}:~:text=${encoded}`;
}
