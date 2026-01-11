import { describe, it, expect } from 'vitest';
import {
  compareTokens,
  formatDiffText,
  formatDiffJSON,
} from './compare-tokens.js';
import type { DTCGTokens } from '../types/dtcg.js';

describe('Token Diff Engine', () => {
  describe('compareTokens', () => {
    it('should detect added tokens', () => {
      const oldTokens: DTCGTokens = {
        colors: {
          primary: { $value: '#FF0000', $type: 'color' },
        },
      };

      const newTokens: DTCGTokens = {
        colors: {
          primary: { $value: '#FF0000', $type: 'color' },
          secondary: { $value: '#00FF00', $type: 'color' },
        },
      };

      const diff = compareTokens(oldTokens, newTokens);

      expect(diff.added).toHaveLength(1);
      expect(diff.added[0].path).toEqual(['colors', 'secondary']);
      expect(diff.added[0].newValue).toBe('#00FF00');
      expect(diff.summary.addedCount).toBe(1);
    });

    it('should detect removed tokens', () => {
      const oldTokens: DTCGTokens = {
        colors: {
          primary: { $value: '#FF0000', $type: 'color' },
          secondary: { $value: '#00FF00', $type: 'color' },
        },
      };

      const newTokens: DTCGTokens = {
        colors: {
          primary: { $value: '#FF0000', $type: 'color' },
        },
      };

      const diff = compareTokens(oldTokens, newTokens);

      expect(diff.removed).toHaveLength(1);
      expect(diff.removed[0].path).toEqual(['colors', 'secondary']);
      expect(diff.removed[0].oldValue).toBe('#00FF00');
      expect(diff.summary.removedCount).toBe(1);
    });

    it('should detect modified token values', () => {
      const oldTokens: DTCGTokens = {
        colors: {
          primary: { $value: '#FF0000', $type: 'color' },
        },
      };

      const newTokens: DTCGTokens = {
        colors: {
          primary: { $value: '#AA0000', $type: 'color' },
        },
      };

      const diff = compareTokens(oldTokens, newTokens);

      expect(diff.modified).toHaveLength(1);
      expect(diff.modified[0].path).toEqual(['colors', 'primary']);
      expect(diff.modified[0].oldValue).toBe('#FF0000');
      expect(diff.modified[0].newValue).toBe('#AA0000');
      expect(diff.summary.modifiedCount).toBe(1);
    });

    it('should detect modified token types', () => {
      const oldTokens: DTCGTokens = {
        value: { $value: '16px', $type: 'dimension' },
      };

      const newTokens: DTCGTokens = {
        value: { $value: '16px', $type: 'string' },
      };

      const diff = compareTokens(oldTokens, newTokens);

      expect(diff.modified).toHaveLength(1);
      expect(diff.summary.modifiedCount).toBe(1);
    });

    it('should detect modified descriptions', () => {
      const oldTokens: DTCGTokens = {
        color: { $value: '#FF0000', $type: 'color', $description: 'Old description' },
      };

      const newTokens: DTCGTokens = {
        color: { $value: '#FF0000', $type: 'color', $description: 'New description' },
      };

      const diff = compareTokens(oldTokens, newTokens);

      expect(diff.modified).toHaveLength(1);
      expect(diff.summary.modifiedCount).toBe(1);
    });

    it('should identify unchanged tokens', () => {
      const oldTokens: DTCGTokens = {
        colors: {
          primary: { $value: '#FF0000', $type: 'color' },
        },
      };

      const newTokens: DTCGTokens = {
        colors: {
          primary: { $value: '#FF0000', $type: 'color' },
        },
      };

      const diff = compareTokens(oldTokens, newTokens);

      expect(diff.unchanged).toHaveLength(1);
      expect(diff.unchanged[0].path).toEqual(['colors', 'primary']);
      expect(diff.summary.unchangedCount).toBe(1);
      expect(diff.summary.totalChanges).toBe(0);
    });

    it('should handle complex nested structures', () => {
      const oldTokens: DTCGTokens = {
        colors: {
          primary: {
            light: { $value: '#FF0000', $type: 'color' },
            dark: { $value: '#AA0000', $type: 'color' },
          },
        },
      };

      const newTokens: DTCGTokens = {
        colors: {
          primary: {
            light: { $value: '#FF0000', $type: 'color' },
            dark: { $value: '#990000', $type: 'color' },
            medium: { $value: '#CC0000', $type: 'color' },
          },
        },
      };

      const diff = compareTokens(oldTokens, newTokens);

      expect(diff.added).toHaveLength(1);
      expect(diff.modified).toHaveLength(1);
      expect(diff.unchanged).toHaveLength(1);
      expect(diff.summary.totalChanges).toBe(2);
    });

    it('should calculate summary correctly', () => {
      const oldTokens: DTCGTokens = {
        a: { $value: '1', $type: 'string' },
        b: { $value: '2', $type: 'string' },
        c: { $value: '3', $type: 'string' },
      };

      const newTokens: DTCGTokens = {
        b: { $value: '2-modified', $type: 'string' },
        c: { $value: '3', $type: 'string' },
        d: { $value: '4', $type: 'string' },
      };

      const diff = compareTokens(oldTokens, newTokens);

      expect(diff.summary.addedCount).toBe(1); // d
      expect(diff.summary.removedCount).toBe(1); // a
      expect(diff.summary.modifiedCount).toBe(1); // b
      expect(diff.summary.unchangedCount).toBe(1); // c
      expect(diff.summary.totalChanges).toBe(3); // a + b + d
    });

    it('should handle empty token trees', () => {
      const diff1 = compareTokens({}, {});
      expect(diff1.summary.totalChanges).toBe(0);

      const diff2 = compareTokens({}, { a: { $value: '1', $type: 'string' } });
      expect(diff2.summary.addedCount).toBe(1);

      const diff3 = compareTokens({ a: { $value: '1', $type: 'string' } }, {});
      expect(diff3.summary.removedCount).toBe(1);
    });
  });

  describe('formatDiffText', () => {
    it('should format diff with colors enabled', () => {
      const oldTokens: DTCGTokens = {
        a: { $value: '1', $type: 'string' },
      };
      const newTokens: DTCGTokens = {
        b: { $value: '2', $type: 'string' },
      };

      const diff = compareTokens(oldTokens, newTokens);
      const text = formatDiffText(diff, true);

      expect(text).toContain('Token Diff Summary');
      expect(text).toContain('Added:');
      expect(text).toContain('Removed:');
      expect(text).toContain('\x1b['); // ANSI color codes
    });

    it('should format diff without colors when disabled', () => {
      const oldTokens: DTCGTokens = {
        a: { $value: '1', $type: 'string' },
      };
      const newTokens: DTCGTokens = {
        b: { $value: '2', $type: 'string' },
      };

      const diff = compareTokens(oldTokens, newTokens);
      const text = formatDiffText(diff, false);

      expect(text).toContain('Token Diff Summary');
      expect(text).not.toContain('\x1b['); // No ANSI codes
    });

    it('should show "No changes" for identical trees', () => {
      const tokens: DTCGTokens = {
        a: { $value: '1', $type: 'string' },
      };

      const diff = compareTokens(tokens, tokens);
      const text = formatDiffText(diff);

      expect(text).toContain('No changes detected');
    });

    it('should display added tokens with values', () => {
      const diff = compareTokens(
        {},
        { color: { $value: '#FF0000', $type: 'color' } }
      );

      const text = formatDiffText(diff);

      expect(text).toContain('Added Tokens:');
      expect(text).toContain('color');
      expect(text).toContain('#FF0000');
    });

    it('should display removed tokens with values', () => {
      const diff = compareTokens(
        { color: { $value: '#FF0000', $type: 'color' } },
        {}
      );

      const text = formatDiffText(diff);

      expect(text).toContain('Removed Tokens:');
      expect(text).toContain('color');
      expect(text).toContain('#FF0000');
    });

    it('should display modified tokens with before/after', () => {
      const diff = compareTokens(
        { color: { $value: '#FF0000', $type: 'color' } },
        { color: { $value: '#00FF00', $type: 'color' } }
      );

      const text = formatDiffText(diff);

      expect(text).toContain('Modified Tokens:');
      expect(text).toContain('#FF0000');
      expect(text).toContain('#00FF00');
    });
  });

  describe('formatDiffJSON', () => {
    it('should format diff as valid JSON', () => {
      const oldTokens: DTCGTokens = {
        a: { $value: '1', $type: 'string' },
      };
      const newTokens: DTCGTokens = {
        b: { $value: '2', $type: 'string' },
      };

      const diff = compareTokens(oldTokens, newTokens);
      const json = formatDiffJSON(diff);

      expect(() => JSON.parse(json)).not.toThrow();
    });

    it('should include all diff data', () => {
      const diff = compareTokens(
        { a: { $value: '1', $type: 'string' } },
        { b: { $value: '2', $type: 'string' } }
      );

      const json = formatDiffJSON(diff);
      const parsed = JSON.parse(json);

      expect(parsed).toHaveProperty('added');
      expect(parsed).toHaveProperty('removed');
      expect(parsed).toHaveProperty('modified');
      expect(parsed).toHaveProperty('unchanged');
      expect(parsed).toHaveProperty('summary');
    });

    it('should preserve token details', () => {
      const diff = compareTokens(
        { color: { $value: '#FF0000', $type: 'color', $description: 'Red' } },
        { color: { $value: '#00FF00', $type: 'color', $description: 'Green' } }
      );

      const json = formatDiffJSON(diff);
      const parsed = JSON.parse(json);

      expect(parsed.modified[0].oldToken.$description).toBe('Red');
      expect(parsed.modified[0].newToken.$description).toBe('Green');
    });
  });
});
