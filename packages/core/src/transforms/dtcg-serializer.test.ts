import { describe, it, expect } from 'vitest';
import {
  serializeDTCG,
  removeExtensions,
  sortTokenKeys,
} from './dtcg-serializer.js';
import type { DTCGTokens } from '../types/dtcg.js';

describe('DTCG Serializer', () => {
  const sampleTokens: DTCGTokens = {
    colors: {
      $type: 'color',
      primary: {
        $value: '#FF0000',
        $description: 'Primary brand color',
        $extensions: {
          'com.figma': { variableId: '123' },
        },
      },
      secondary: {
        $value: '#00FF00',
      },
    },
    spacing: {
      $type: 'dimension',
      small: { $value: '8px' },
      medium: { $value: '16px' },
    },
  };

  describe('serializeDTCG', () => {
    it('should serialize tokens to JSON string', () => {
      const result = serializeDTCG(sampleTokens);
      expect(typeof result).toBe('string');
      expect(() => JSON.parse(result)).not.toThrow();
    });

    it('should include extensions by default', () => {
      const result = serializeDTCG(sampleTokens);
      const parsed = JSON.parse(result);
      expect(parsed.colors.primary.$extensions).toBeDefined();
    });

    it('should exclude extensions when includeExtensions is false', () => {
      const result = serializeDTCG(sampleTokens, { includeExtensions: false });
      const parsed = JSON.parse(result);
      expect(parsed.colors.primary.$extensions).toBeUndefined();
    });

    it('should preserve descriptions when removing extensions', () => {
      const result = serializeDTCG(sampleTokens, { includeExtensions: false });
      const parsed = JSON.parse(result);
      expect(parsed.colors.primary.$description).toBe('Primary brand color');
    });

    it('should use specified indentation', () => {
      const result2 = serializeDTCG(sampleTokens, { indent: 2 });
      const result4 = serializeDTCG(sampleTokens, { indent: 4 });

      expect(result2).toContain('  '); // 2 spaces
      expect(result4).toContain('    '); // 4 spaces
      expect(result2.length).toBeLessThan(result4.length);
    });

    it('should create compact output with indent 0', () => {
      const result = serializeDTCG(sampleTokens, { indent: 0 });
      expect(result).not.toContain('\n');
      expect(result).not.toContain('  ');
    });

    it('should sort keys alphabetically when sortKeys is true', () => {
      const unsorted: DTCGTokens = {
        z: { $value: '1', $type: 'string' },
        a: { $value: '2', $type: 'string' },
        m: { $value: '3', $type: 'string' },
      };

      const result = serializeDTCG(unsorted, { sortKeys: true, indent: 0 });
      const aIndex = result.indexOf('"a"');
      const mIndex = result.indexOf('"m"');
      const zIndex = result.indexOf('"z"');

      expect(aIndex).toBeLessThan(mIndex);
      expect(mIndex).toBeLessThan(zIndex);
    });

    it('should maintain insertion order when sortKeys is false', () => {
      const tokens: DTCGTokens = {
        z: { $value: '1', $type: 'string' },
        a: { $value: '2', $type: 'string' },
      };

      const result = serializeDTCG(tokens, { sortKeys: false, indent: 0 });
      const zIndex = result.indexOf('"z"');
      const aIndex = result.indexOf('"a"');

      expect(zIndex).toBeLessThan(aIndex);
    });

    it('should handle nested token groups', () => {
      const nested: DTCGTokens = {
        colors: {
          primary: {
            light: { $value: '#FF0000', $type: 'color' },
            dark: { $value: '#AA0000', $type: 'color' },
          },
        },
      };

      const result = serializeDTCG(nested);
      const parsed = JSON.parse(result);

      expect(parsed.colors.primary.light.$value).toBe('#FF0000');
      expect(parsed.colors.primary.dark.$value).toBe('#AA0000');
    });

    it('should round-trip correctly', () => {
      const serialized = serializeDTCG(sampleTokens);
      const parsed = JSON.parse(serialized);
      const reserialized = serializeDTCG(parsed);

      expect(reserialized).toBe(serialized);
    });
  });

  describe('removeExtensions', () => {
    it('should remove $extensions from all tokens', () => {
      const result = removeExtensions(sampleTokens);
      expect(result.colors.primary).not.toHaveProperty('$extensions');
    });

    it('should preserve other properties', () => {
      const result = removeExtensions(sampleTokens);
      expect(result.colors.primary.$value).toBe('#FF0000');
      expect(result.colors.primary.$description).toBe('Primary brand color');
    });

    it('should handle nested groups', () => {
      const nested: DTCGTokens = {
        colors: {
          primary: {
            light: {
              $value: '#FF0000',
              $type: 'color',
              $extensions: { test: true },
            },
          },
        },
      };

      const result = removeExtensions(nested);
      expect(result.colors.primary.light).not.toHaveProperty('$extensions');
      expect(result.colors.primary.light.$value).toBe('#FF0000');
    });

    it('should not mutate original tokens', () => {
      const original: DTCGTokens = {
        color: {
          $value: '#FF0000',
          $type: 'color',
          $extensions: { test: true },
        },
      };

      removeExtensions(original);
      expect(original.color).toHaveProperty('$extensions');
    });
  });

  describe('sortTokenKeys', () => {
    it('should sort keys alphabetically', () => {
      const unsorted: DTCGTokens = {
        z: { $value: '1', $type: 'string' },
        a: { $value: '2', $type: 'string' },
        m: { $value: '3', $type: 'string' },
      };

      const result = sortTokenKeys(unsorted);
      const keys = Object.keys(result);

      expect(keys).toEqual(['a', 'm', 'z']);
    });

    it('should sort nested groups recursively', () => {
      const nested: DTCGTokens = {
        z: {
          c: { $value: '1', $type: 'string' },
          a: { $value: '2', $type: 'string' },
        },
        a: {
          b: { $value: '3', $type: 'string' },
        },
      };

      const result = sortTokenKeys(nested);
      const topKeys = Object.keys(result);
      const zKeys = Object.keys(result.z as DTCGTokens);

      expect(topKeys).toEqual(['a', 'z']);
      expect(zKeys).toEqual(['a', 'c']);
    });

    it('should preserve token values', () => {
      const tokens: DTCGTokens = {
        b: { $value: 'second', $type: 'string' },
        a: { $value: 'first', $type: 'string' },
      };

      const result = sortTokenKeys(tokens);
      expect(result.a.$value).toBe('first');
      expect(result.b.$value).toBe('second');
    });

    it('should not mutate original tokens', () => {
      const original: DTCGTokens = {
        z: { $value: '1', $type: 'string' },
        a: { $value: '2', $type: 'string' },
      };

      const originalKeys = Object.keys(original);
      sortTokenKeys(original);
      const afterKeys = Object.keys(original);

      expect(afterKeys).toEqual(originalKeys);
    });
  });
});
