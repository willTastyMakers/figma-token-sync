import fs from 'fs/promises';
import type { DTCGToken, DTCGTokens } from '../types/dtcg.js';
import { isToken, isTokenGroup } from './dtcg-parser.js';

/**
 * Serialize DTCG tokens to JSON string
 *
 * @param tokens - Token tree to serialize
 * @param options - Serialization options
 * @returns Formatted JSON string
 */
export function serializeDTCG(
  tokens: DTCGTokens,
  options: SerializeOptions = {}
): string {
  const {
    indent = 2,
    sortKeys = false,
    includeExtensions = true,
  } = options;

  // Clean tokens if needed
  const cleaned = includeExtensions ? tokens : removeExtensions(tokens);

  // Sort keys if requested
  const sorted = sortKeys ? sortTokenKeys(cleaned) : cleaned;

  return JSON.stringify(sorted, null, indent);
}

/**
 * Serialize tokens and write to file
 *
 * @param tokens - Token tree to serialize
 * @param filePath - Output file path
 * @param options - Serialization options
 */
export async function writeDTCGFile(
  tokens: DTCGTokens,
  filePath: string,
  options: SerializeOptions = {}
): Promise<void> {
  const json = serializeDTCG(tokens, options);
  await fs.writeFile(filePath, json, 'utf-8');
}

/**
 * Remove $extensions from all tokens (for cleaner output)
 *
 * @param tokens - Token tree
 * @returns New token tree without extensions
 */
export function removeExtensions(tokens: DTCGTokens): DTCGTokens {
  const result: DTCGTokens = {};

  for (const [key, value] of Object.entries(tokens)) {
    if (isToken(value)) {
      const { $extensions, ...cleanToken } = value;
      result[key] = cleanToken as DTCGToken;
    } else if (isTokenGroup(value)) {
      result[key] = removeExtensions(value);
    } else {
      result[key] = value;
    }
  }

  return result;
}

/**
 * Recursively sort object keys alphabetically
 *
 * @param tokens - Token tree
 * @returns New token tree with sorted keys
 */
export function sortTokenKeys(tokens: DTCGTokens): DTCGTokens {
  const result: DTCGTokens = {};
  const keys = Object.keys(tokens).sort();

  for (const key of keys) {
    const value = tokens[key];
    if (isToken(value)) {
      result[key] = value;
    } else if (isTokenGroup(value)) {
      result[key] = sortTokenKeys(value);
    } else {
      result[key] = value;
    }
  }

  return result;
}

/**
 * Options for serializing DTCG tokens
 */
export interface SerializeOptions {
  /**
   * Number of spaces for indentation (default: 2)
   */
  indent?: number;

  /**
   * Whether to sort keys alphabetically (default: false)
   */
  sortKeys?: boolean;

  /**
   * Whether to include $extensions (default: true)
   */
  includeExtensions?: boolean;
}
