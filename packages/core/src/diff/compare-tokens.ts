import type { DTCGToken, DTCGTokens } from '../types/dtcg.js';
import { isToken, walkTokens } from '../transforms/dtcg-parser.js';

/**
 * Diff types
 */
export type DiffType = 'added' | 'removed' | 'modified' | 'unchanged';

/**
 * Represents a single token difference
 */
export interface TokenDiff {
  path: string[];
  type: DiffType;
  oldValue?: unknown;
  newValue?: unknown;
  oldToken?: DTCGToken;
  newToken?: DTCGToken;
}

/**
 * Complete diff result
 */
export interface DiffResult {
  added: TokenDiff[];
  removed: TokenDiff[];
  modified: TokenDiff[];
  unchanged: TokenDiff[];
  summary: {
    totalChanges: number;
    addedCount: number;
    removedCount: number;
    modifiedCount: number;
    unchangedCount: number;
  };
}

/**
 * Compare two token trees and return differences
 *
 * @param oldTokens - Original token tree
 * @param newTokens - Updated token tree
 * @returns Structured diff result
 */
export function compareTokens(oldTokens: DTCGTokens, newTokens: DTCGTokens): DiffResult {
  const added: TokenDiff[] = [];
  const removed: TokenDiff[] = [];
  const modified: TokenDiff[] = [];
  const unchanged: TokenDiff[] = [];

  // Build maps of all tokens by path
  const oldTokenMap = new Map<string, DTCGToken>();
  const newTokenMap = new Map<string, DTCGToken>();

  walkTokens(oldTokens, (path, token) => {
    oldTokenMap.set(path.join('.'), token);
  });

  walkTokens(newTokens, (path, token) => {
    newTokenMap.set(path.join('.'), token);
  });

  // Find added and modified tokens
  for (const [pathStr, newToken] of newTokenMap) {
    const path = pathStr.split('.');
    const oldToken = oldTokenMap.get(pathStr);

    if (!oldToken) {
      // Token was added
      added.push({
        path,
        type: 'added',
        newValue: newToken.$value,
        newToken,
      });
    } else {
      // Token exists in both - check if modified
      if (isTokenModified(oldToken, newToken)) {
        modified.push({
          path,
          type: 'modified',
          oldValue: oldToken.$value,
          newValue: newToken.$value,
          oldToken,
          newToken,
        });
      } else {
        unchanged.push({
          path,
          type: 'unchanged',
          oldValue: oldToken.$value,
          newValue: newToken.$value,
          oldToken,
          newToken,
        });
      }
    }
  }

  // Find removed tokens
  for (const [pathStr, oldToken] of oldTokenMap) {
    const path = pathStr.split('.');
    if (!newTokenMap.has(pathStr)) {
      removed.push({
        path,
        type: 'removed',
        oldValue: oldToken.$value,
        oldToken,
      });
    }
  }

  return {
    added,
    removed,
    modified,
    unchanged,
    summary: {
      totalChanges: added.length + removed.length + modified.length,
      addedCount: added.length,
      removedCount: removed.length,
      modifiedCount: modified.length,
      unchangedCount: unchanged.length,
    },
  };
}

/**
 * Check if a token has been modified
 */
function isTokenModified(oldToken: DTCGToken, newToken: DTCGToken): boolean {
  // Compare $value
  if (JSON.stringify(oldToken.$value) !== JSON.stringify(newToken.$value)) {
    return true;
  }

  // Compare $type
  if (oldToken.$type !== newToken.$type) {
    return true;
  }

  // Compare $description
  if (oldToken.$description !== newToken.$description) {
    return true;
  }

  return false;
}

/**
 * Format a diff result as human-readable text
 */
export function formatDiffText(diff: DiffResult, useColor: boolean = true): string {
  const lines: string[] = [];

  // Color codes
  const green = (text: string) => useColor ? `\x1b[32m${text}\x1b[0m` : text;
  const red = (text: string) => useColor ? `\x1b[31m${text}\x1b[0m` : text;
  const yellow = (text: string) => useColor ? `\x1b[33m${text}\x1b[0m` : text;
  const bold = (text: string) => useColor ? `\x1b[1m${text}\x1b[0m` : text;

  lines.push('');
  lines.push(bold('Token Diff Summary'));
  lines.push('='.repeat(50));
  lines.push(`${green('+')} Added:    ${diff.summary.addedCount}`);
  lines.push(`${red('-')} Removed:  ${diff.summary.removedCount}`);
  lines.push(`${yellow('~')} Modified: ${diff.summary.modifiedCount}`);
  lines.push(`  Unchanged: ${diff.summary.unchangedCount}`);
  lines.push('='.repeat(50));
  lines.push('');

  if (diff.summary.totalChanges === 0) {
    lines.push('No changes detected.');
    return lines.join('\n');
  }

  // Show added tokens
  if (diff.added.length > 0) {
    lines.push(bold(green('Added Tokens:')));
    for (const item of diff.added) {
      lines.push(`${green('+')} ${item.path.join('.')} = ${JSON.stringify(item.newValue)}`);
    }
    lines.push('');
  }

  // Show removed tokens
  if (diff.removed.length > 0) {
    lines.push(bold(red('Removed Tokens:')));
    for (const item of diff.removed) {
      lines.push(`${red('-')} ${item.path.join('.')} = ${JSON.stringify(item.oldValue)}`);
    }
    lines.push('');
  }

  // Show modified tokens
  if (diff.modified.length > 0) {
    lines.push(bold(yellow('Modified Tokens:')));
    for (const item of diff.modified) {
      lines.push(`${yellow('~')} ${item.path.join('.')}`);
      lines.push(`  ${red('-')} ${JSON.stringify(item.oldValue)}`);
      lines.push(`  ${green('+')} ${JSON.stringify(item.newValue)}`);
    }
    lines.push('');
  }

  return lines.join('\n');
}

/**
 * Format a diff result as JSON
 */
export function formatDiffJSON(diff: DiffResult): string {
  return JSON.stringify(diff, null, 2);
}