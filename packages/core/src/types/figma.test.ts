import { describe, it, expect } from 'vitest';
import {
  figmaColorToHex,
  hexToFigmaColor,
  isVariableAlias,
  isRGBA,
} from './figma.js';
import type { FigmaRGBA, FigmaVariableAlias } from './figma.js';

describe('Figma Color Utilities', () => {
  describe('figmaColorToHex', () => {
    it('should convert RGB to hex', () => {
      const color: FigmaRGBA = { r: 1, g: 0, b: 0, a: 1 };
      expect(figmaColorToHex(color)).toBe('#ff0000');
    });

    it('should convert with alpha channel', () => {
      const color: FigmaRGBA = { r: 1, g: 0, b: 0, a: 0.5 };
      expect(figmaColorToHex(color)).toBe('#ff000080');
    });

    it('should handle black', () => {
      const color: FigmaRGBA = { r: 0, g: 0, b: 0, a: 1 };
      expect(figmaColorToHex(color)).toBe('#000000');
    });

    it('should handle white', () => {
      const color: FigmaRGBA = { r: 1, g: 1, b: 1, a: 1 };
      expect(figmaColorToHex(color)).toBe('#ffffff');
    });

    it('should handle partial values', () => {
      const color: FigmaRGBA = { r: 0.5, g: 0.5, b: 0.5, a: 1 };
      const hex = figmaColorToHex(color);
      expect(hex).toMatch(/^#[0-9a-f]{6}$/);
    });

    it('should omit alpha when fully opaque', () => {
      const color: FigmaRGBA = { r: 0.5, g: 0.5, b: 0.5, a: 1 };
      const hex = figmaColorToHex(color);
      expect(hex.length).toBe(7); // #RRGGBB
    });

    it('should include alpha when transparent', () => {
      const color: FigmaRGBA = { r: 0.5, g: 0.5, b: 0.5, a: 0.5 };
      const hex = figmaColorToHex(color);
      expect(hex.length).toBe(9); // #RRGGBBAA
    });
  });

  describe('hexToFigmaColor', () => {
    it('should convert hex to RGB', () => {
      const color = hexToFigmaColor('#ff0000');
      expect(color.r).toBeCloseTo(1, 2);
      expect(color.g).toBeCloseTo(0, 2);
      expect(color.b).toBeCloseTo(0, 2);
      expect(color.a).toBe(1);
    });

    it('should handle hex with alpha', () => {
      const color = hexToFigmaColor('#ff000080');
      expect(color.r).toBeCloseTo(1, 2);
      expect(color.g).toBeCloseTo(0, 2);
      expect(color.b).toBeCloseTo(0, 2);
      expect(color.a).toBeCloseTo(0.5, 2);
    });

    it('should handle hex without #', () => {
      const color = hexToFigmaColor('ff0000');
      expect(color.r).toBeCloseTo(1, 2);
      expect(color.g).toBeCloseTo(0, 2);
      expect(color.b).toBeCloseTo(0, 2);
    });

    it('should handle black', () => {
      const color = hexToFigmaColor('#000000');
      expect(color.r).toBe(0);
      expect(color.g).toBe(0);
      expect(color.b).toBe(0);
      expect(color.a).toBe(1);
    });

    it('should handle white', () => {
      const color = hexToFigmaColor('#ffffff');
      expect(color.r).toBe(1);
      expect(color.g).toBe(1);
      expect(color.b).toBe(1);
      expect(color.a).toBe(1);
    });

    it('should default alpha to 1 when not specified', () => {
      const color = hexToFigmaColor('#808080');
      expect(color.a).toBe(1);
    });
  });

  describe('round-trip conversion', () => {
    it('should maintain color through round-trip', () => {
      const original: FigmaRGBA = { r: 0.5, g: 0.25, b: 0.75, a: 1 };
      const hex = figmaColorToHex(original);
      const converted = hexToFigmaColor(hex);

      expect(converted.r).toBeCloseTo(original.r, 2);
      expect(converted.g).toBeCloseTo(original.g, 2);
      expect(converted.b).toBeCloseTo(original.b, 2);
      expect(converted.a).toBe(original.a);
    });

    it('should maintain alpha through round-trip', () => {
      const original: FigmaRGBA = { r: 1, g: 0, b: 0, a: 0.5 };
      const hex = figmaColorToHex(original);
      const converted = hexToFigmaColor(hex);

      expect(converted.a).toBeCloseTo(original.a, 2);
    });
  });

  describe('isVariableAlias', () => {
    it('should identify variable aliases', () => {
      const alias: FigmaVariableAlias = {
        type: 'VARIABLE_ALIAS',
        id: '123',
      };
      expect(isVariableAlias(alias)).toBe(true);
    });

    it('should reject non-aliases', () => {
      expect(isVariableAlias({ r: 1, g: 0, b: 0, a: 1 })).toBe(false);
      expect(isVariableAlias('string')).toBe(false);
      expect(isVariableAlias(123)).toBe(false);
      expect(isVariableAlias(null)).toBe(false);
      expect(isVariableAlias({ type: 'OTHER', id: '123' })).toBe(false);
    });
  });

  describe('isRGBA', () => {
    it('should identify RGBA colors', () => {
      const color: FigmaRGBA = { r: 1, g: 0, b: 0, a: 1 };
      expect(isRGBA(color)).toBe(true);
    });

    it('should reject non-RGBA values', () => {
      expect(isRGBA({ type: 'VARIABLE_ALIAS', id: '123' })).toBe(false);
      expect(isRGBA('string')).toBe(false);
      expect(isRGBA(123)).toBe(false);
      expect(isRGBA(null)).toBe(false);
      expect(isRGBA({ r: 1, g: 0 })).toBe(false); // Missing b
    });
  });
});
