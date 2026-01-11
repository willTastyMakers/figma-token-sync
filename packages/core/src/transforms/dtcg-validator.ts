import type { DTCGTokens, DTCGToken } from '../types/dtcg.js';

/**
 * Validation error types
 */
export type ValidationErrorType =
  | 'VALUE_WITH_CHILDREN'      // $value at same level as child tokens
  | 'MISSING_TYPE'             // Missing $type property
  | 'INVALID_ALIAS'            // Alias reference doesn't resolve
  | 'CIRCULAR_ALIAS'           // Circular alias reference
  | 'EMPTY_VALUE';             // Empty or undefined $value

export interface ValidationError {
  type: ValidationErrorType;
  path: string;
  message: string;
  severity: 'error' | 'warning';
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
}

/**
 * Validate DTCG token structure for compliance
 *
 * Checks:
 * - No object has both $value and child tokens (DTCG violation)
 * - All aliases resolve to valid paths
 * - Required $type properties are present
 */
export function validateDTCGTokens(
  tokens: DTCGTokens,
  allTokens?: DTCGTokens
): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationError[] = [];

  // Use provided allTokens for alias resolution, or default to tokens
  const tokenRegistry = allTokens || tokens;

  // Validate the token tree
  validateTokenTree(tokens, [], tokenRegistry, errors, warnings);

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Recursively validate token tree
 */
function validateTokenTree(
  obj: any,
  path: string[],
  tokenRegistry: DTCGTokens,
  errors: ValidationError[],
  warnings: ValidationError[],
  parentType?: string
): void {
  if (!obj || typeof obj !== 'object') return;

  const hasValue = '$value' in obj;
  const hasType = '$type' in obj;

  // Get child properties (non-$ properties)
  const childKeys = Object.keys(obj).filter(k => !k.startsWith('$'));
  const hasChildren = childKeys.length > 0;

  // CRITICAL: Check for $value + children violation
  if (hasValue && hasChildren) {
    errors.push({
      type: 'VALUE_WITH_CHILDREN',
      path: path.join('.'),
      message: `Object has both $value and child tokens. This violates DTCG spec. Either remove $value (if this is a group) or remove children (if this is a token).`,
      severity: 'error',
    });
  }

  // If this is a token (has $value)
  if (hasValue) {
    const value = obj.$value;

    // Check for empty value
    if (value === undefined || value === null || value === '') {
      errors.push({
        type: 'EMPTY_VALUE',
        path: path.join('.'),
        message: `Token has empty or undefined $value`,
        severity: 'error',
      });
    }

    // Check for missing $type (unless inherited from parent)
    if (!hasType && !parentType) {
      warnings.push({
        type: 'MISSING_TYPE',
        path: path.join('.'),
        message: `Token missing $type property (not inherited from parent group)`,
        severity: 'warning',
      });
    }

    // Validate alias references
    if (typeof value === 'string' && value.startsWith('{') && value.endsWith('}')) {
      validateAlias(value, path, tokenRegistry, errors);
    }
  }

  // Recurse into children
  const currentType = hasType ? obj.$type : parentType;
  for (const key of childKeys) {
    validateTokenTree(obj[key], [...path, key], tokenRegistry, errors, warnings, currentType);
  }
}

/**
 * Validate alias reference
 */
function validateAlias(
  alias: string,
  path: string[],
  tokenRegistry: DTCGTokens,
  errors: ValidationError[]
): void {
  // Extract the reference path (remove { })
  const refPath = alias.slice(1, -1);

  // Check if it's a circular reference
  const currentPath = path.join('.');
  if (refPath === currentPath) {
    errors.push({
      type: 'CIRCULAR_ALIAS',
      path: currentPath,
      message: `Circular alias reference: token references itself`,
      severity: 'error',
    });
    return;
  }

  // Try to resolve the reference
  const segments = refPath.split('.');
  let current: any = tokenRegistry;

  for (const segment of segments) {
    if (!current || typeof current !== 'object') {
      errors.push({
        type: 'INVALID_ALIAS',
        path: path.join('.'),
        message: `Alias "${alias}" cannot be resolved: path segment "${segment}" not found`,
        severity: 'error',
      });
      return;
    }
    current = current[segment];
  }

  // Check if the resolved value is a valid token
  if (!current || typeof current !== 'object' || !('$value' in current)) {
    errors.push({
      type: 'INVALID_ALIAS',
      path: path.join('.'),
      message: `Alias "${alias}" does not point to a valid token (missing $value)`,
      severity: 'error',
    });
  }
}

/**
 * Format validation result as human-readable string
 */
export function formatValidationResult(result: ValidationResult): string {
  const lines: string[] = [];

  if (result.valid) {
    lines.push('✓ DTCG validation passed');
  } else {
    lines.push('✗ DTCG validation failed');
  }

  if (result.errors.length > 0) {
    lines.push('');
    lines.push(`Errors (${result.errors.length}):`);
    for (const error of result.errors) {
      lines.push(`  - [${error.type}] ${error.path}: ${error.message}`);
    }
  }

  if (result.warnings.length > 0) {
    lines.push('');
    lines.push(`Warnings (${result.warnings.length}):`);
    for (const warning of result.warnings) {
      lines.push(`  - [${warning.type}] ${warning.path}: ${warning.message}`);
    }
  }

  return lines.join('\n');
}
