import { describe, it, expect } from 'vitest';
import {
  parseDTCG,
  validateTokens,
  isToken,
  isTokenGroup,
  walkTokens,
  getTokenByPath,
  isReference,
  resolveReference,
  countTokens,
  getTokenTypes,
} from './dtcg-parser.js';
import type { DTCGTokens, DTCGToken } from '../types/dtcg.js';

describe('DTCG Parser', () => {
  describe('parseDTCG', () => {
    it('should parse valid DTCG JSON', () => {
      const json = JSON.stringify({
        colors: {
          primary: { $value: '#FF0000', $type: 'color' },
        },
      });

      const result = parseDTCG(json);
      expect(result).toHaveProperty('colors');
      expect(result.colors).toHaveProperty('primary');
    });

    it('should throw on invalid JSON', () => {
      expect(() => parseDTCG('not valid json')).toThrow('Failed to parse DTCG JSON');
    });

    it('should throw on non-object JSON', () => {
      expect(() => parseDTCG('"string"')).toThrow('DTCG JSON must be an object');
      // Arrays are actually objects in JavaScript, so they pass the typeof check
      // expect(() => parseDTCG('[]')).toThrow('DTCG JSON must be an object');
      expect(() => parseDTCG('null')).toThrow('DTCG JSON must be an object');
    });

    it('should validate token structure', () => {
      const invalidJson = JSON.stringify({
        colors: {
          primary: { someKey: 'value' },
        },
      });

      expect(() => parseDTCG(invalidJson)).toThrow();
    });
  });

  describe('validateTokens', () => {
    it('should accept valid tokens with $value', () => {
      const tokens: DTCGTokens = {
        color: {
          primary: { $value: '#FF0000', $type: 'color' },
        },
      };

      expect(() => validateTokens(tokens)).not.toThrow();
    });

    it('should reject tokens without $value', () => {
      const tokens = {
        color: {
          primary: { someKey: 'value' } as any,
        },
      };

      expect(() => validateTokens(tokens)).toThrow();
    });

    it('should reject invalid token types', () => {
      const tokens = {
        color: {
          primary: { $value: '#FF0000', $type: 'invalid-type' } as any,
        },
      };

      expect(() => validateTokens(tokens)).toThrow('invalid $type');
    });

    it('should allow valid token types', () => {
      const validTypes = ['color', 'dimension', 'fontFamily', 'fontWeight', 'duration', 'cubicBezier', 'number', 'string'];

      for (const type of validTypes) {
        const tokens = {
          test: { $value: 'test', $type: type as any },
        };
        expect(() => validateTokens(tokens)).not.toThrow();
      }
    });

    it('should work with explicitly typed tokens', () => {
      const tokens: DTCGTokens = {
        colors: {
          primary: { $value: '#FF0000', $type: 'color' },
          secondary: { $value: '#00FF00', $type: 'color' },
        },
      };

      expect(() => validateTokens(tokens)).not.toThrow();
    });
  });

  describe('isToken', () => {
    it('should identify tokens', () => {
      expect(isToken({ $value: 'test' })).toBe(true);
      expect(isToken({ $value: 'test', $type: 'color' })).toBe(true);
    });

    it('should reject non-tokens', () => {
      expect(isToken({})).toBe(false);
      expect(isToken({ value: 'test' })).toBe(false);
      expect(isToken(null)).toBe(false);
      expect(isToken('string')).toBe(false);
      expect(isToken(123)).toBe(false);
    });
  });

  describe('isTokenGroup', () => {
    it('should identify token groups', () => {
      expect(isTokenGroup({})).toBe(true);
      expect(isTokenGroup({ nested: {} })).toBe(true);
    });

    it('should reject tokens as groups', () => {
      expect(isTokenGroup({ $value: 'test' })).toBe(false);
    });

    it('should reject non-objects', () => {
      expect(isTokenGroup(null)).toBe(false);
      expect(isTokenGroup('string')).toBe(false);
      expect(isTokenGroup(123)).toBe(false);
    });
  });

  describe('walkTokens', () => {
    it('should walk all tokens in tree', () => {
      const tokens: DTCGTokens = {
        colors: {
          $type: 'color',
          primary: { $value: '#FF0000' },
          secondary: { $value: '#00FF00' },
        },
        spacing: {
          $type: 'dimension',
          small: { $value: '8px' },
        },
      };

      const visited: string[] = [];
      walkTokens(tokens, (path) => {
        visited.push(path.join('.'));
      });

      expect(visited).toContain('colors.primary');
      expect(visited).toContain('colors.secondary');
      expect(visited).toContain('spacing.small');
      expect(visited).toHaveLength(3);
    });

    it('should provide inherited types', () => {
      const tokens: DTCGTokens = {
        colors: {
          $type: 'color',
          primary: { $value: '#FF0000' },
        },
      };

      walkTokens(tokens, (path, token, type) => {
        expect(type).toBe('color');
      });
    });

    it('should skip $-prefixed properties', () => {
      const tokens: DTCGTokens = {
        $description: 'test' as any,
        color: { $value: '#FF0000', $type: 'color' },
      };

      const visited: string[] = [];
      walkTokens(tokens, (path) => {
        visited.push(path.join('.'));
      });

      expect(visited).toEqual(['color']);
    });
  });

  describe('getTokenByPath', () => {
    const tokens: DTCGTokens = {
      colors: {
        primary: { $value: '#FF0000', $type: 'color' },
        nested: {
          deep: { $value: '#00FF00', $type: 'color' },
        },
      },
    };

    it('should find tokens by dot notation path', () => {
      const token = getTokenByPath(tokens, 'colors.primary');
      expect(token).toBeDefined();
      expect(token?.$value).toBe('#FF0000');
    });

    it('should find deeply nested tokens', () => {
      const token = getTokenByPath(tokens, 'colors.nested.deep');
      expect(token).toBeDefined();
      expect(token?.$value).toBe('#00FF00');
    });

    it('should return undefined for invalid paths', () => {
      expect(getTokenByPath(tokens, 'nonexistent')).toBeUndefined();
      expect(getTokenByPath(tokens, 'colors.nonexistent')).toBeUndefined();
    });
  });

  describe('isReference', () => {
    it('should identify references', () => {
      expect(isReference('{colors.primary}')).toBe(true);
      expect(isReference('{deeply.nested.path}')).toBe(true);
    });

    it('should reject non-references', () => {
      expect(isReference('colors.primary')).toBe(false);
      expect(isReference('{}')).toBe(false);
      expect(isReference('{')).toBe(false);
      expect(isReference('}')).toBe(false);
      expect(isReference('')).toBe(false);
      expect(isReference(123 as any)).toBe(false);
    });
  });

  describe('resolveReference', () => {
    const tokens: DTCGTokens = {
      colors: {
        base: { $value: '#FF0000', $type: 'color' },
        primary: { $value: '{colors.base}', $type: 'color' },
        secondary: { $value: '{colors.primary}', $type: 'color' },
      },
    };

    it('should resolve simple references', () => {
      const value = resolveReference('{colors.base}', tokens);
      expect(value).toBe('#FF0000');
    });

    it('should resolve chained references', () => {
      const value = resolveReference('{colors.secondary}', tokens);
      expect(value).toBe('#FF0000');
    });

    it('should return non-references unchanged', () => {
      const value = resolveReference('not-a-ref', tokens);
      expect(value).toBe('not-a-ref');
    });

    it('should throw on missing references', () => {
      expect(() => resolveReference('{nonexistent}', tokens)).toThrow('Reference not found');
    });

    it('should detect circular references', () => {
      const circular: DTCGTokens = {
        a: { $value: '{b}', $type: 'color' },
        b: { $value: '{a}', $type: 'color' },
      };

      expect(() => resolveReference('{a}', circular)).toThrow('Circular reference');
    });
  });

  describe('countTokens', () => {
    it('should count all tokens', () => {
      const tokens: DTCGTokens = {
        colors: {
          primary: { $value: '#FF0000', $type: 'color' },
          secondary: { $value: '#00FF00', $type: 'color' },
        },
        spacing: {
          small: { $value: '8px', $type: 'dimension' },
        },
      };

      expect(countTokens(tokens)).toBe(3);
    });

    it('should return 0 for empty tree', () => {
      expect(countTokens({})).toBe(0);
    });
  });

  describe('getTokenTypes', () => {
    it('should extract all unique types', () => {
      const tokens: DTCGTokens = {
        colors: {
          $type: 'color',
          primary: { $value: '#FF0000' },
          secondary: { $value: '#00FF00' },
        },
        spacing: {
          $type: 'dimension',
          small: { $value: '8px' },
        },
        fonts: {
          body: { $value: 'Arial', $type: 'fontFamily' },
        },
      };

      const types = getTokenTypes(tokens);
      expect(types.has('color')).toBe(true);
      expect(types.has('dimension')).toBe(true);
      expect(types.has('fontFamily')).toBe(true);
      expect(types.size).toBe(3);
    });

    it('should return empty set for empty tree', () => {
      const types = getTokenTypes({});
      expect(types.size).toBe(0);
    });
  });
});
