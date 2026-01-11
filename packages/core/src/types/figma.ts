/**
 * Figma Plugin API Types for Variables
 *
 * These types represent data structures from the Figma Plugin API,
 * NOT the REST API (which requires Enterprise plan).
 *
 * @see https://www.figma.com/plugin-docs/api/figma-variables/
 */

// ============================================
// Variable Types
// ============================================

export type FigmaVariableResolvedType = 'BOOLEAN' | 'COLOR' | 'FLOAT' | 'STRING';

export interface FigmaRGB {
  r: number;  // 0-1
  g: number;  // 0-1
  b: number;  // 0-1
}

export interface FigmaRGBA extends FigmaRGB {
  a: number;  // 0-1
}

export interface FigmaVariableAlias {
  type: 'VARIABLE_ALIAS';
  id: string;
}

export type FigmaVariableValue =
    | boolean                    // BOOLEAN
    | FigmaRGB                   // COLOR (no alpha)
    | FigmaRGBA                  // COLOR (with alpha)
    | number                     // FLOAT
    | string                     // STRING
    | FigmaVariableAlias;        // Reference to another variable

/**
 * Variable Scopes - controls where a variable can be used
 */
export type FigmaVariableScope =
    | 'ALL_SCOPES'
    | 'TEXT_CONTENT'
    | 'CORNER_RADIUS'
    | 'WIDTH_HEIGHT'
    | 'GAP'
    | 'ALL_FILLS'
    | 'FRAME_FILL'
    | 'SHAPE_FILL'
    | 'TEXT_FILL'
    | 'STROKE_COLOR'
    | 'STROKE_FLOAT'
    | 'EFFECT_FLOAT'
    | 'EFFECT_COLOR'
    | 'OPACITY'
    | 'FONT_FAMILY'
    | 'FONT_STYLE'
    | 'FONT_WEIGHT'
    | 'FONT_SIZE'
    | 'LINE_HEIGHT'
    | 'LETTER_SPACING'
    | 'PARAGRAPH_SPACING'
    | 'PARAGRAPH_INDENT';

// ============================================
// Serialized Types (for tokens.json)
// ============================================

/**
 * Serialized variable data for export/import via tokens.json
 * This is what gets written to tokens.json by the Figma Plugin
 */
export interface SerializedFigmaVariable {
  id: string;
  name: string;
  resolvedType: FigmaVariableResolvedType;
  valuesByMode: Record<string, FigmaVariableValue>;
  description?: string;
  scopes?: FigmaVariableScope[];
  collectionId: string;
}

/**
 * Serialized collection data for export/import
 */
export interface SerializedFigmaCollection {
  id: string;
  name: string;
  modes: Array<{ modeId: string; name: string }>;
  defaultModeId: string;
  variableIds: string[];
}

/**
 * Complete export structure from Figma Plugin
 * This is the format of the data the Plugin sends to UI for download
 */
export interface FigmaPluginExport {
  version: string;
  exportedAt: string;
  collections: SerializedFigmaCollection[];
  variables: SerializedFigmaVariable[];
}

// ============================================
// Transform Types
// ============================================

/**
 * Internal representation used during transforms
 * Normalized structure for easier processing
 */
export interface NormalizedVariable {
  path: string[];                // e.g., ['colors', 'primary', '500']
  type: FigmaVariableResolvedType;
  values: Record<string, FigmaVariableValue>;  // mode -> value
  description?: string;
  scopes?: FigmaVariableScope[];
  collectionName: string;
  isAlias: boolean;
  aliasPath?: string[];          // If isAlias, the path of the referenced variable
}

/**
 * Collection metadata
 */
export interface CollectionMeta {
  name: string;
  modes: Array<{ id: string; name: string }>;
  defaultMode: string;
}

// ============================================
// Utility Type Guards
// ============================================

export function isVariableAlias(value: FigmaVariableValue): value is FigmaVariableAlias {
  return typeof value === 'object' && value !== null && 'type' in value && value.type === 'VARIABLE_ALIAS';
}

export function isRGBA(value: FigmaVariableValue): value is FigmaRGBA {
  return typeof value === 'object' && value !== null && 'r' in value && 'g' in value && 'b' in value;
}

// ============================================
// Color Conversion Utilities
// ============================================

export function figmaColorToHex(color: FigmaRGBA): string {
  const toHex = (n: number) => Math.round(n * 255).toString(16).padStart(2, '0');
  const hex = `#${toHex(color.r)}${toHex(color.g)}${toHex(color.b)}`;
  if (color.a !== undefined && color.a < 1) {
    return hex + toHex(color.a);
  }
  return hex;
}

export function hexToFigmaColor(hex: string): FigmaRGBA {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.slice(0, 2), 16) / 255;
  const g = parseInt(clean.slice(2, 4), 16) / 255;
  const b = parseInt(clean.slice(4, 6), 16) / 255;
  const a = clean.length === 8 ? parseInt(clean.slice(6, 8), 16) / 255 : 1;
  return { r, g, b, a };
}

// ============================================
// REST API Types (DEPRECATED - Enterprise Only)
// ============================================

/**
 * @deprecated REST API requires Enterprise plan. Use Plugin API instead.
 * Kept for reference in packages/core/src/api/figma-rest-api.ts
 */
export interface FigmaVariable {
  id: string;
  name: string;
  key?: string;
  variableCollectionId: string;
  resolvedType: FigmaVariableResolvedType;
  valuesByMode: Record<string, FigmaVariableValue>;
  remote?: boolean;
  description?: string;
  hiddenFromPublishing?: boolean;
  scopes?: FigmaVariableScope[];
  codeSyntax?: Record<string, string>;
}

/**
 * @deprecated REST API requires Enterprise plan.
 */
export interface FigmaVariablesResponse {
  status: number;
  error: boolean;
  meta: {
    variables: Record<string, FigmaVariable>;
    variableCollections: Record<string, SerializedFigmaCollection>;
  };
}

/**
 * @deprecated REST API requires Enterprise plan.
 */
export interface FigmaPushResponse {
  success: boolean;
  created: number;
  updated: number;
  deleted: number;
  errors: string[];
}
