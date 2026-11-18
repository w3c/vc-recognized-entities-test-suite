/*
 * SPDX-License-Identifier: LicenseRef-w3c-3-clause-bsd-license-2008 OR LicenseRef-w3c-test-suite-license-2023
 */

const Handlebars = require('handlebars');

// Test suites title matrices with their spec section number ("3.1 General
// Properties"); template headings do not, so compare without the number.
function stripSectionNumber(title) {
  return title.replace(/^\d+(\.\d+)*\s+/, '');
}

// Matrices rendered by a slot, so the fallback can list the rest.
function placedSet(root) {
  root.placedMatrices = root.placedMatrices || new Set();
  return root.placedMatrices;
}

Handlebars.registerHelper('matrixByTitle', (title, options) => {
  const root = options.data.root;
  const placed = placedSet(root);
  const matches = (root.matrices || []).filter(item =>
    stripSectionNumber(item.title) === stripSectionNumber(title) &&
    item.rows?.length > 0);
  if(matches.length === 0) {
    return '';
  }
  for(const matrix of matches) {
    placed.add(matrix);
  }
  return matches.map(matrix => options.fn(matrix)).join('');
});

// Matrices with results that no slot rendered.
Handlebars.registerHelper('unplacedMatrices', function(options) {
  const root = options.data.root;
  const placed = placedSet(root);
  return (root.matrices || []).filter(item =>
    item.rows?.length > 0 && !placed.has(item) && item.title !== 'At Risk');
});

// Escapes a statement and wraps its RFC 2119 keywords, as the TR does with
// <em class="rfc2119">. Keywords are matched in uppercase only, as RFC 2119
// requires, so "must" in ordinary prose is left alone.
const KEYWORDS = /\b(MUST NOT|SHOULD NOT|MUST|REQUIRED|SHOULD|MAY)\b/g;
Handlebars.registerHelper('highlightStatement', text => {
  const escaped = String(text ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  return new Handlebars.SafeString(escaped.replace(KEYWORDS,
    '<strong class="rfc2119">$1</strong>'));
});

// A short row title: the statement cut at a word boundary, with an ellipsis.
// The full statement goes in the hover bubble.
const SHORT_TITLE_LENGTH = 30;
Handlebars.registerHelper('shortStatement', text => {
  const full = String(text ?? '');
  if(full.length <= SHORT_TITLE_LENGTH) {
    return full;
  }
  const cut = full.slice(0, SHORT_TITLE_LENGTH);
  const word = cut.lastIndexOf(' ');
  return (word > 0 ? cut.slice(0, word) : cut) + ' …';
});

// The text of a matrix row. Every row's id is its key, and the spec sentence is
// in each cell as `statement`. A row with no statement in its cells falls back
// to its id.
// Rows that the reporter marks at risk lose their cells, so their text comes
// from the registry the tests fill (row key -> statement text). The report is
// rendered in the same process as the tests, so the registry is complete.
Handlebars.registerHelper('rowStatement', row => {
  const cell = (row?.cells ?? []).find(c => c?.cell?.statement);
  if(cell) {
    return cell.cell.statement;
  }
  return globalThis.interopRowText?.[row?.id] ?? (row?.id ?? '');
});

// Renders the block only when one of the named matrices has results. Titles
// are given without section numbers. Use it to hide headings with no tests.
Handlebars.registerHelper('ifMatrix', function(...args) {
  const options = args.pop();
  const titles = new Set(args.map(stripSectionNumber));
  const root = options.data.root;
  const found = (root.matrices || []).some(item =>
    titles.has(stripSectionNumber(item.title)) && item.rows?.length > 0);
  return found ? options.fn(this) : options.inverse(this);
});
