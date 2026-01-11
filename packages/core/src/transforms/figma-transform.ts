import type { DTCGToken, DTCGTokens } from '../types/dtcg.js';
import type {
  FigmaPluginExport,
  SerializedFigmaVariable,
  SerializedFigmaCollection,
  FigmaVariableValue,
  FigmaRGBA,
  FigmaVariableAlias,
} from '../types/figma.js';
import { figmaColorToHex, hexToFigmaColor, isVariableAlias } from '../types/figma.js';
import { validateDTCGTokens, type ValidationResult } from './dtcg-validator.js';

/**
 * Result of DTCG export with primitives and semantic tokens separated
 */
export interface DTCGExportResult {
  primitives: DTCGTokens;
  semantic: DTCGTokens;
  validation: {
    primitives: ValidationResult;
    semantic: ValidationResult;
  };
}

/**
 * Convert Figma Plugin export data to DTCG tokens
 * Returns separate primitives and semantic token trees to comply with DTCG spec
 *
 * @param figmaData - Export data from Figma Plugin
 * @param options - Conversion options
 * @returns Separated primitives and semantic token trees
 */
export function figmaToTokens(
  figmaData: FigmaPluginExport,
  options: FigmaToTokensOptions = {}
): DTCGExportResult {
  const { mode = 'default', includeAllModes = false } = options;

  const primitives: DTCGTokens = {};
  const semantic: DTCGTokens = {};

  // Build collection lookup
  const collections = new Map<string, SerializedFigmaCollection>();
  for (const collection of figmaData.collections) {
    collections.set(collection.id, collection);
  }

  // Build variable ID to path mapping for alias resolution
  // Semantic tokens reference primitives WITHOUT collection prefix (e.g., "{primary.40}")
  const variableIdToPath = new Map<string, string>();
  for (const variable of figmaData.variables) {
    const pathSegments = variable.name.split('/').map(s => sanitizeTokenName(s));
    const tokenPath = pathSegments.join('.');
    variableIdToPath.set(variable.id, tokenPath);
  }

  // Classify variables into primitives and semantic
  const primitiveVars: SerializedFigmaVariable[] = [];
  const semanticVars: SerializedFigmaVariable[] = [];

  for (const variable of figmaData.variables) {
    const collection = collections.get(variable.collectionId);
    if (!collection) continue;

    // Get the mode ID
    let modeId: string;
    if (mode === 'default') {
      modeId = collection.defaultModeId;
    } else {
      const modeObj = collection.modes.find(m => m.name === mode);
      if (!modeObj) {
        console.warn(`Mode "${mode}" not found in collection "${collection.name}"`);
        continue;
      }
      modeId = modeObj.modeId;
    }

    const value = variable.valuesByMode[modeId];
    if (value === undefined) continue;

    // Classification logic:
    // - Has "/" in name → primitive (e.g., "primary/40")
    // - No "/" in name → semantic (e.g., "primary", "onPrimary")
    //   Semantic tokens may have raw values OR aliases - both are valid
    const hasSeparator = variable.name.includes('/');

    if (hasSeparator) {
      // Primitive variable (e.g., "primary/40")
      primitiveVars.push(variable);
    } else {
      // Semantic variable (e.g., "primary", "onPrimary", "dark-primary")
      // Can have raw values like #4C662B or aliases like {primary.100}
      semanticVars.push(variable);
    }
  }

  console.log(`[CLASSIFICATION] Primitives: ${primitiveVars.length}, Semantic: ${semanticVars.length}`);

  // Process primitives
  for (const variable of primitiveVars) {
    const collection = collections.get(variable.collectionId);
    if (!collection) continue;

    addVariableToTokens(
      primitives,
      variable,
      collection,
      mode,
      includeAllModes,
      variableIdToPath,
      'primitive'
    );
  }

  // Process semantic
  for (const variable of semanticVars) {
    const collection = collections.get(variable.collectionId);
    if (!collection) continue;

    addVariableToTokens(
      semantic,
      variable,
      collection,
      mode,
      includeAllModes,
      variableIdToPath,
      'semantic'
    );
  }

  // Validate both token trees
  // Semantic tokens may reference primitives, so pass primitives for alias resolution
  const primitivesValidation = validateDTCGTokens(primitives);
  const semanticValidation = validateDTCGTokens(semantic, primitives);

  console.log('[VALIDATION] Primitives:', primitivesValidation.valid ? '✓ Valid' : '✗ Invalid');
  if (!primitivesValidation.valid) {
    console.error('[VALIDATION] Primitives errors:', primitivesValidation.errors);
  }

  console.log('[VALIDATION] Semantic:', semanticValidation.valid ? '✓ Valid' : '✗ Invalid');
  if (!semanticValidation.valid) {
    console.error('[VALIDATION] Semantic errors:', semanticValidation.errors);
  }

  return {
    primitives,
    semantic,
    validation: {
      primitives: primitivesValidation,
      semantic: semanticValidation,
    },
  };
}

/**
 * Add a Figma variable to token tree
 */
function addVariableToTokens(
  tokens: DTCGTokens,
  variable: SerializedFigmaVariable,
  collection: SerializedFigmaCollection,
  targetMode: string,
  includeAllModes: boolean,
  variableIdToPath: Map<string, string>,
  classification: 'primitive' | 'semantic'
): void {
  // Parse variable name into path
  // e.g., "primary/40" -> ["primary", "40"]
  const pathSegments = variable.name.split('/').map(s => sanitizeTokenName(s));

  // Get the mode ID
  let modeId: string;
  if (targetMode === 'default') {
    modeId = collection.defaultModeId;
  } else {
    const mode = collection.modes.find(m => m.name === targetMode);
    if (!mode) {
      console.warn(`Mode "${targetMode}" not found in collection "${collection.name}"`);
      return;
    }
    modeId = mode.modeId;
  }

  // Get value for the target mode
  const value = variable.valuesByMode[modeId];
  if (value === undefined) {
    console.warn(`[FILTERED] Variable "${variable.name}" has no value for mode "${targetMode}" (modeId: ${modeId})`);
    return;
  }

  console.log(`[PROCESSING] ${classification} "${variable.name}"`);

  if (classification === 'primitive') {
    // Primitives: Create nested structure with $type at group level
    // e.g., "primary/40" becomes { primary: { $type: "color", "40": { $value: "#..." } } }

    let current: DTCGTokens = tokens;

    // Navigate to parent group, creating structure as needed
    for (let i = 0; i < pathSegments.length - 1; i++) {
      const segment = pathSegments[i];
      if (!(segment in current)) {
        current[segment] = {
          $type: mapFigmaTypeToDTCG(variable.resolvedType), // Add $type at group level
        } as any; // Group with $type only (valid DTCG)
      }
      current = current[segment] as DTCGTokens;
    }

    const tokenName = pathSegments[pathSegments.length - 1];

    // Create the leaf token ($value only, $type inherited from parent group)
    const token: any = {
      $value: convertFigmaValueToDTCG(value, variable.resolvedType, variableIdToPath),
    };

    if (variable.description) {
      token.$description = variable.description;
    }

    // Add Figma-specific metadata
    token.$extensions = {
      'com.figma': {
        variableId: variable.id,
        collectionId: variable.collectionId,
        scopes: variable.scopes || [],
      },
    };

    current[tokenName] = token;

  } else {
    // Semantic: Flat structure with $type and $value at each token
    // e.g., "primary" becomes { primary: { $type: "color", $value: "{primary.40}" } }

    // Semantic tokens are flat (no nesting)
    const tokenName = pathSegments[0];

    const token: DTCGToken = {
      $type: mapFigmaTypeToDTCG(variable.resolvedType),
      $value: convertFigmaValueToDTCG(value, variable.resolvedType, variableIdToPath),
    };

    if (variable.description) {
      token.$description = variable.description;
    }

    // Add Figma-specific metadata
    token.$extensions = {
      'com.figma': {
        variableId: variable.id,
        collectionId: variable.collectionId,
        scopes: variable.scopes || [],
      },
    };

    tokens[tokenName] = token;
  }
}

/**
 * Map Figma variable type to DTCG token type
 */
function mapFigmaTypeToDTCG(figmaType: string): DTCGToken['$type'] {
  switch (figmaType) {
    case 'COLOR':
      return 'color';
    case 'FLOAT':
      return 'number';
    case 'STRING':
      return 'string';
    case 'BOOLEAN':
      return 'string'; // DTCG doesn't have boolean, use string
    default:
      return 'string';
  }
}

/**
 * Convert Figma variable value to DTCG format
 */
function convertFigmaValueToDTCG(
  value: FigmaVariableValue,
  type: string,
  variableIdToPath: Map<string, string>
): string | number | string[] {
  if (isVariableAlias(value)) {
    // Resolve alias ID to DTCG reference path
    const refPath = variableIdToPath.get(value.id);
    if (refPath) {
      return `{${refPath}}`;
    }
    // Fallback: if ID not found in map, keep the ID (shouldn't happen)
    console.warn(`Could not resolve variable alias ID: ${value.id}`);
    return `{${value.id}}`;
  }

  if (type === 'COLOR' && typeof value === 'object' && 'r' in value) {
    return figmaColorToHex(value as FigmaRGBA);
  }

  if (typeof value === 'number' || typeof value === 'string' || typeof value === 'boolean') {
    return value.toString();
  }

  return String(value);
}

/**
 * Convert DTCG tokens to Figma Plugin import format
 *
 * @param tokens - DTCG token tree
 * @param options - Conversion options
 * @returns Figma variables ready for import
 */
export function tokensToFigma(
  tokens: DTCGTokens,
  options: TokensToFigmaOptions = {}
): SerializedFigmaVariable[] {
  const { collectionName = 'Tokens', defaultModeName = 'Mode 1' } = options;

  const variables: SerializedFigmaVariable[] = [];
  const collectionId = `collection-${collectionName}`;

  // Walk token tree and create variables
  walkTokensForFigma(tokens, (path, token, type) => {
    const variable: SerializedFigmaVariable = {
      id: `var-${path.join('-')}`,
      name: path.join('/'),
      resolvedType: mapDTCGTypeToFigma(type || token.$type || 'string'),
      valuesByMode: {
        'mode-1': convertDTCGValueToFigma(token.$value, type || token.$type || 'string'),
      },
      collectionId,
    };

    if (token.$description) {
      variable.description = token.$description;
    }

    if (token.$extensions?.['com.figma']) {
      const figmaExt = token.$extensions['com.figma'] as any;
      if (figmaExt.scopes) {
        variable.scopes = figmaExt.scopes;
      }
    }

    variables.push(variable);
  });

  return variables;
}

/**
 * Map DTCG token type to Figma variable type
 */
function mapDTCGTypeToFigma(dtcgType: string): 'COLOR' | 'FLOAT' | 'STRING' | 'BOOLEAN' {
  switch (dtcgType) {
    case 'color':
      return 'COLOR';
    case 'dimension':
    case 'number':
      return 'FLOAT';
    case 'string':
    case 'fontFamily':
    case 'fontWeight':
    case 'duration':
    case 'cubicBezier':
      return 'STRING';
    default:
      return 'STRING';
  }
}

/**
 * Convert DTCG value to Figma format
 */
function convertDTCGValueToFigma(
  value: unknown,
  type: string
): FigmaVariableValue {
  if (typeof value === 'string') {
    // Check if it's a reference
    if (value.startsWith('{') && value.endsWith('}')) {
      const refPath = value.slice(1, -1);
      return {
        type: 'VARIABLE_ALIAS',
        id: refPath,  // Note: Will need ID resolution
      };
    }

    // Convert color hex to RGBA
    if (type === 'color' && value.startsWith('#')) {
      return hexToFigmaColor(value);
    }

    return value;
  }

  if (typeof value === 'number') {
    return value;
  }

  if (Array.isArray(value)) {
    // Font family array -> join as string
    return value.join(', ');
  }

  return String(value);
}

/**
 * Walk token tree for Figma conversion
 */
function walkTokensForFigma(
  tokens: DTCGTokens,
  callback: (path: string[], token: DTCGToken, type?: string) => void,
  path: string[] = [],
  parentType?: string
): void {
  for (const [key, value] of Object.entries(tokens)) {
    if (key.startsWith('$')) continue;

    const currentPath = [...path, key];

    if (isToken(value)) {
      const type = value.$type || parentType;
      callback(currentPath, value, type);
    } else if (typeof value === 'object' && value !== null) {
      const groupType = ('$type' in value && typeof value.$type === 'string')
        ? value.$type
        : parentType;
      walkTokensForFigma(value as DTCGTokens, callback, currentPath, groupType);
    }
  }
}

/**
 * Check if value is a token
 */
function isToken(value: unknown): value is DTCGToken {
  return typeof value === 'object' && value !== null && '$value' in value;
}

/**
 * Sanitize name for use as token key
 */
function sanitizeTokenName(name: string): string {
  return name
    .replace(/[^a-zA-Z0-9-_]/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase();
}

export interface FigmaToTokensOptions {
  /**
   * Mode name to extract (default: 'default' uses defaultModeId)
   */
  mode?: string;

  /**
   * Include all modes in $extensions (default: false)
   */
  includeAllModes?: boolean;
}

export interface TokensToFigmaOptions {
  /**
   * Collection name for created variables
   */
  collectionName?: string;

  /**
   * Default mode name
   */
  defaultModeName?: string;
}
