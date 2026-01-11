import fs from 'fs/promises';
import type { DTCGToken, DTCGTokens } from '../types/dtcg.js';

/**
 * Type guard to check if an object is a DTCG token
 */
export function isToken(obj: unknown): obj is DTCGToken {
  return typeof obj === 'object' && obj !== null && '$value' in obj;
}

/**
 * Type guard to check if an object is a token group
 */
export function isTokenGroup(obj: unknown): obj is DTCGTokens {
  if (typeof obj !== 'object' || obj === null) return false;
  if ('$value' in obj) return false; // It's a token, not a group
  return true;
}

/**
 * Parse DTCG JSON string to tokens object
 *
 * @param json - DTCG formatted JSON string
 * @returns Parsed and validated token object
 * @throws Error if JSON is invalid or doesn't conform to DTCG spec
 */
export function parseDTCG(json: string): DTCGTokens {
  let parsed: unknown;

  try {
    parsed = JSON.parse(json);
  } catch (error) {
    throw new Error(
      `Failed to parse DTCG JSON: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }

  if (typeof parsed !== 'object' || parsed === null) {
    throw new Error('DTCG JSON must be an object');
  }

  // Validate the structure
  validateTokens(parsed as DTCGTokens);

  return parsed as DTCGTokens;
}

/**
 * Validate DTCG token structure
 * Ensures all tokens have required $value property
 *
 * @param tokens - Tokens to validate
 * @param path - Current path in token tree (for error messages)
 * @param parentType - Type inherited from parent group
 * @throws Error if validation fails
 */
export function validateTokens(
  tokens: DTCGTokens,
  path: string[] = [],
  parentType?: string
): void {
  for (const [key, value] of Object.entries(tokens)) {
    // Skip DTCG reserved properties (like $type, $description, $extensions)
    if (key.startsWith('$')) {
      continue;
    }

    const currentPath = [...path, key];
    const pathStr = currentPath.join('.');

    if (isToken(value)) {
      // Validate token has $value
      if (value.$value === undefined) {
        throw new Error(`Token "${pathStr}" is missing required $value property`);
      }

      // Validate $type if present
      if (value.$type) {
        const validTypes = [
          'color',
          'dimension',
          'fontFamily',
          'fontWeight',
          'duration',
          'cubicBezier',
          'number',
          'string'
        ];
        if (!validTypes.includes(value.$type)) {
          throw new Error(
            `Token "${pathStr}" has invalid $type: "${value.$type}". Valid types: ${validTypes.join(', ')}`
          );
        }
      } else if (!parentType) {
        // Warn if neither explicit $type nor inherited type
        console.warn(`Token "${pathStr}" has no $type (neither explicit nor inherited)`);
      }
    } else if (isTokenGroup(value)) {
      // Recursively validate nested group
      const groupType = ('$type' in value && typeof value.$type === 'string')
        ? value.$type
        : parentType;

      validateTokens(value, currentPath, groupType);
    } else {
      throw new Error(
        `Invalid value at "${pathStr}": must be either a token (with $value) or a group (object)`
      );
    }
  }
}

/**
 * Walk through all tokens in a token tree, calling callback for each token
 *
 * @param tokens - Token tree to traverse
 * @param callback - Function called for each token with (path, token, inheritedType)
 * @param path - Current path (internal, leave empty)
 * @param parentType - Inherited type from parent group (internal)
 */
export function walkTokens(
  tokens: DTCGTokens,
  callback: (path: string[], token: DTCGToken, type: string | undefined) => void,
  path: string[] = [],
  parentType?: string
): void {
  for (const [key, value] of Object.entries(tokens)) {
    // Skip reserved properties
    if (key.startsWith('$')) continue;

    const currentPath = [...path, key];

    if (isToken(value)) {
      const effectiveType = value.$type || parentType;
      callback(currentPath, value, effectiveType);
    } else if (isTokenGroup(value)) {
      // Check if group defines a type
      const groupType = ('$type' in value && typeof value.$type === 'string')
        ? value.$type
        : parentType;

      // Recurse into group
      walkTokens(value, callback, currentPath, groupType);
    }
  }
}

/**
 * Get a token by its dot-notation path
 *
 * @param tokens - Token tree
 * @param path - Dot-notation path (e.g., "colors.primary.500")
 * @returns Token if found, undefined otherwise
 */
export function getTokenByPath(tokens: DTCGTokens, path: string): DTCGToken | undefined {
  const segments = path.split('.');
  let current: unknown = tokens;

  for (const segment of segments) {
    if (typeof current === 'object' && current !== null && segment in current) {
      current = (current as Record<string, unknown>)[segment];
    } else {
      return undefined;
    }
  }

  return isToken(current) ? current : undefined;
}

/**
 * Check if a value is a reference to another token
 * References are in the format "{path.to.token}"
 *
 * @param value - Value to check
 * @returns True if value is a reference string
 */
export function isReference(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    value.startsWith('{') &&
    value.endsWith('}') &&
    value.length > 2
  );
}

/**
 * Resolve a token reference to its actual value
 *
 * @param ref - Reference string (e.g., "{colors.primary.500}")
 * @param tokens - Token tree to resolve from
 * @param visitedRefs - Set of visited references (for circular detection)
 * @returns Resolved value
 * @throws Error if reference is invalid or circular
 */
export function resolveReference(
  ref: string,
  tokens: DTCGTokens,
  visitedRefs: Set<string> = new Set()
): unknown {
  if (!isReference(ref)) {
    return ref;
  }

  // Check for circular references
  if (visitedRefs.has(ref)) {
    throw new Error(`Circular reference detected: ${ref}`);
  }

  visitedRefs.add(ref);

  // Extract path from "{path.to.token}"
  const path = ref.slice(1, -1);
  const token = getTokenByPath(tokens, path);

  if (!token) {
    throw new Error(`Reference not found: ${ref}`);
  }

  // If the resolved value is also a reference, recurse
  if (isReference(token.$value)) {
    return resolveReference(token.$value as string, tokens, visitedRefs);
  }

  return token.$value;
}

/**
 * Load and parse DTCG tokens from a JSON file
 *
 * @param filePath - Path to tokens.json file
 * @returns Parsed tokens
 * @throws Error if file cannot be read or parsed
 */
export async function loadDTCGFile(filePath: string): Promise<DTCGTokens> {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    return parseDTCG(content);
  } catch (error) {
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
      throw new Error(`DTCG file not found: ${filePath}`);
    }
    throw error;
  }
}

/**
 * Count total number of tokens in a token tree
 *
 * @param tokens - Token tree
 * @returns Number of tokens
 */
export function countTokens(tokens: DTCGTokens): number {
  let count = 0;
  walkTokens(tokens, () => count++);
  return count;
}

/**
 * Extract all unique token types used in a token tree
 *
 * @param tokens - Token tree
 * @returns Set of token types
 */
export function getTokenTypes(tokens: DTCGTokens): Set<string> {
  const types = new Set<string>();
  walkTokens(tokens, (_, token, inheritedType) => {
    const type = token.$type || inheritedType;
    if (type) types.add(type);
  });
  return types;
}
