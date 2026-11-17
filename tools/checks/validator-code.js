/*
 * SPDX-License-Identifier: LicenseRef-w3c-3-clause-bsd-license-2008 OR LicenseRef-w3c-test-suite-license-2023
 */

// Checkers on validator code and validator output, kept with their self-tests.
// They are tools of the suite, not part of the interop run.

import {isUrl} from './recognized-entities.js';

const isFunctionNode = node =>
  /^(FunctionDeclaration|FunctionExpression|ArrowFunctionExpression)$/
    .test(node?.type ?? '');

// Does the module's default export resolve to a function? Accepts a function
// or arrow declaration or expression, and a name bound to one by a function
// declaration or a const declaration, exported with `export default name` or
// `export {name as default}`.
export function defaultExportIsFunction(program) {
  const declarations = program.body.map(n =>
    n.type === 'ExportNamedDeclaration' ? n.declaration : n);
  const isFunctionName = name => declarations.some(n =>
    (n?.type === 'FunctionDeclaration' && n.id?.name === name) ||
    (n?.type === 'VariableDeclaration' && n.kind === 'const' &&
      n.declarations.some(d => d.id?.name === name && isFunctionNode(d.init))));
  for(const n of program.body) {
    if(n.type === 'ExportDefaultDeclaration') {
      return isFunctionNode(n.declaration) ||
        (n.declaration.type === 'Identifier' &&
          isFunctionName(n.declaration.name));
    }
    if(n.type === 'ExportNamedDeclaration' && !n.source) {
      const specifier = n.specifiers.find(sp =>
        (sp.exported.name ?? sp.exported.value) === 'default');
      if(specifier) {
        return isFunctionName(specifier.local.name);
      }
    }
  }
  return false;
}

// 4.4.1.1 (6): each item in errors and warnings is a ProblemDetails object
// (VC DM 2.0, section 7.2): a type URL, with title and detail as strings.
export function problemDetailsViolations(item) {
  const violations = [];
  if(item === null || typeof item !== 'object' || Array.isArray(item)) {
    return ['item must be an object'];
  }
  if(!isUrl(item.type)) {
    violations.push('type must be a URL');
  }
  for(const member of ['title', 'detail']) {
    if(item[member] !== undefined && typeof item[member] !== 'string') {
      violations.push(`${member} must be a string when present`);
    }
  }
  return violations;
}
