/**
 * Figma Plugin Sandbox Code
 *
 * This file runs in Figma's sandbox environment and has access to:
 * - Figma Plugin API (figma.*)
 * - Variables API (figma.variables.*)
 *
 * It communicates with the UI (ui.html) via postMessage.
 */

import { figmaToTokens, tokensToFigma } from '@figma-token-sync/core/transforms/figma-transform';
import type {
  FigmaPluginExport,
  SerializedFigmaVariable,
  SerializedFigmaCollection,
  FigmaVariableValue,
} from '@figma-token-sync/core/types/figma';
import type { DTCGTokens } from '@figma-token-sync/core/types/dtcg';

// Show the plugin UI
figma.showUI(__html__, {
  width: 400,
  height: 600,
  title: 'Figma Token Sync',
});

// Handle messages from the UI
figma.ui.onmessage = async (msg) => {
  try {
    switch (msg.type) {
      case 'EXPORT_VARIABLES':
        await handleExport();
        break;

      case 'IMPORT_VARIABLES':
        await handleImport(msg.tokens);
        break;

      case 'CANCEL':
        figma.closePlugin();
        break;

      default:
        console.warn('Unknown message type:', msg.type);
    }
  } catch (error) {
    figma.ui.postMessage({
      type: 'ERROR',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * Export Variables from Figma to DTCG format
 */
async function handleExport() {
  figma.ui.postMessage({
    type: 'EXPORT_PROGRESS',
    message: 'Reading Variables from Figma...',
  });

  // Get all variable collections and variables
  const collections = await figma.variables.getLocalVariableCollectionsAsync();
  const variables = await figma.variables.getLocalVariablesAsync();

  figma.ui.postMessage({
    type: 'EXPORT_PROGRESS',
    message: `Found ${collections.length} collections, ${variables.length} variables`,
  });

  // Serialize collections
  const serializedCollections: SerializedFigmaCollection[] = collections.map(collection => ({
    id: collection.id,
    name: collection.name,
    modes: collection.modes.map(mode => ({
      modeId: mode.modeId,
      name: mode.name,
    })),
    defaultModeId: collection.defaultModeId,
    variableIds: collection.variableIds,
  }));

  // Serialize variables
  const serializedVariables: SerializedFigmaVariable[] = variables.map(variable => ({
    id: variable.id,
    name: variable.name,
    resolvedType: variable.resolvedType,
    valuesByMode: variable.valuesByMode,
    description: variable.description || undefined,
    scopes: variable.scopes.length > 0 ? variable.scopes : undefined,
    collectionId: variable.variableCollectionId,
  }));

  // Create export data structure
  const exportData: FigmaPluginExport = {
    version: '1.0.0',
    exportedAt: new Date().toISOString(),
    collections: serializedCollections,
    variables: serializedVariables,
  };

  // Debug: Log all variables being exported
  console.log('=== FIGMA EXPORT DEBUG ===');
  console.log(`Total variables: ${serializedVariables.length}`);
  serializedVariables.forEach(v => {
    console.log(`Variable: "${v.name}"`, {
      id: v.id,
      type: v.resolvedType,
      collectionId: v.collectionId,
      valuesByMode: v.valuesByMode
    });
    // Log the actual mode IDs and values
    Object.entries(v.valuesByMode).forEach(([modeId, value]) => {
      console.log(`  Mode ${modeId}:`, value);
    });
  });
  serializedCollections.forEach(c => {
    console.log(`Collection: "${c.name}"`, {
      id: c.id,
      defaultModeId: c.defaultModeId,
      modes: c.modes
    });
  });
  console.log('=========================');

  figma.ui.postMessage({
    type: 'EXPORT_PROGRESS',
    message: 'Converting to DTCG format...',
  });

  // Transform to DTCG tokens (returns { primitives, semantic, validation })
  const { primitives, semantic, validation } = figmaToTokens(exportData);

  console.log('=== DTCG EXPORT RESULT ===');
  console.log('Primitives:', JSON.stringify(primitives, null, 2));
  console.log('Semantic:', JSON.stringify(semantic, null, 2));
  console.log('==========================');

  // Check validation results
  const allValid = validation.primitives.valid && validation.semantic.valid;
  const errorCount = validation.primitives.errors.length + validation.semantic.errors.length;
  const warningCount = validation.primitives.warnings.length + validation.semantic.warnings.length;

  figma.ui.postMessage({
    type: 'EXPORT_COMPLETE',
    primitives,
    semantic,
    validation: {
      valid: allValid,
      errorCount,
      warningCount,
      details: validation,
    },
  });

  if (allValid) {
    figma.notify('✓ Export complete! DTCG validation passed');
  } else {
    figma.notify(`⚠️ Export complete with ${errorCount} error(s), ${warningCount} warning(s)`, {
      error: true,
    });
  }
}

/**
 * Import Variables from DTCG format to Figma
 *
 * Two-pass approach:
 * 1. Create all primitive variables (with raw hex values, single mode)
 * 2. Create semantic variables (Light and Dark mode values)
 */
async function handleImport(tokens: unknown) {
  figma.ui.postMessage({
    type: 'IMPORT_PROGRESS',
    message: 'Parsing tokens.json...',
  });

  // Validate tokens
  if (typeof tokens !== 'object' || tokens === null) {
    throw new Error('Invalid tokens: must be an object');
  }

  const dtcgTokens = tokens as Record<string, any>;

  // Extract metadata if present
  const metadata = dtcgTokens.$metadata || {};
  const collectionName = metadata.name || 'Design System';

  console.log(`[METADATA] Collection name: ${collectionName}`);
  if (metadata.version) {
    console.log(`[METADATA] Version: ${metadata.version}`);
  }

  // Helper: detect a collection wrapper (has no $type/$value — its children are the actual tokens)
  function isCollectionWrapper(value: unknown): value is Record<string, any> {
    return (
      typeof value === 'object' &&
      value !== null &&
      !('$type' in (value as object)) &&
      !('$value' in (value as object))
    );
  }

  // Separate primitives from semantics by iterating into collection wrappers.
  // tokens.json top-level shape:
  //   { "$metadata": {...}, "Primitives": { "primary/0": { "$type", "$value": { "Value": "#hex" } } },
  //                         "Semantic":   { "primary":   { "$type", "$value": { "Light": "#hex", "Dark": "#hex" } } } }
  const primitives: Array<{name: string; value: string; type: string}> = [];
  const semantics: Array<{name: string; lightValue: string; darkValue: string; type: string}> = [];

  for (const [collectionKey, collectionValue] of Object.entries(dtcgTokens)) {
    // Skip metadata
    if (collectionKey === '$metadata') continue;

    // Gap 1 fix: skip entries that are not collection wrappers
    if (!isCollectionWrapper(collectionValue)) continue;

    const isPrimitives = collectionKey === 'Primitives';
    const isSemantic = collectionKey === 'Semantic';

    for (const [tokenName, tokenData] of Object.entries(collectionValue)) {
      if (typeof tokenData !== 'object' || tokenData === null || !tokenData.$value) continue;

      const type = tokenData.$type || 'color';
      const rawValue = tokenData.$value; // Gap 2 fix: rawValue is an object, not a string

      if (isPrimitives) {
        // Primitives: $value = { "Value": "#hex" }
        const hex = typeof rawValue === 'object' && rawValue !== null ? rawValue.Value : rawValue;
        if (hex) {
          primitives.push({ name: tokenName, value: hex, type });
        }
      } else if (isSemantic) {
        // Semantics: $value = { "Light": "#hex", "Dark": "#hex" }
        const lightHex = typeof rawValue === 'object' && rawValue !== null ? rawValue.Light : rawValue;
        const darkHex = typeof rawValue === 'object' && rawValue !== null ? rawValue.Dark : rawValue;
        if (lightHex && darkHex) {
          semantics.push({ name: tokenName, lightValue: lightHex, darkValue: darkHex, type });
        }
      }
    }
  }

  console.log(`[IMPORT] Found ${primitives.length} primitives, ${semantics.length} semantics`);

  // Get or create collection
  const existingCollections = await figma.variables.getLocalVariableCollectionsAsync();
  let collection = existingCollections.find(c => c.name === collectionName);

  if (!collection) {
    collection = figma.variables.createVariableCollection(collectionName);
    console.log(`[IMPORT] Created collection: ${collectionName}`);
  }

  const defaultModeId = collection.modes[0].modeId;

  // Ensure Light and Dark modes exist for semantic variables
  let lightModeId = collection.modes.find(m => m.name === 'Light')?.modeId;
  let darkModeId = collection.modes.find(m => m.name === 'Dark')?.modeId;

  if (!lightModeId) {
    // Rename the default mode to "Light"
    collection.renameMode(defaultModeId, 'Light');
    lightModeId = defaultModeId;
    console.log(`[IMPORT] Renamed default mode to "Light"`);
  }

  if (!darkModeId) {
    darkModeId = collection.addMode('Dark');
    console.log(`[IMPORT] Added "Dark" mode: ${darkModeId}`);
  }

  let created = 0;
  let updated = 0;

  // Get existing variables
  const existingVariables = await figma.variables.getLocalVariablesAsync();
  const variablesByName = new Map(existingVariables.map(v => [v.name, v]));

  // Map to track DTCG names to Figma variable IDs
  // DTCG uses dot notation: "primary.100"
  // Figma uses slash notation: "primary/100"
  const dtcgNameToFigmaId = new Map<string, string>();

  // PASS 1: Create/update primitive variables (single mode, raw hex)
  figma.ui.postMessage({
    type: 'IMPORT_PROGRESS',
    message: `Pass 1: Creating ${primitives.length} primitive variables...`,
  });

  for (const prim of primitives) {
    let variable = variablesByName.get(prim.name);

    if (!variable) {
      variable = figma.variables.createVariable(
        prim.name,
        collection,
        prim.type === 'color' ? 'COLOR' : 'FLOAT'
      );
      variablesByName.set(prim.name, variable);
      created++;
      console.log(`[PASS1] Created: ${prim.name}`);
    } else {
      updated++;
    }

    // Set the raw hex value using defaultModeId
    try {
      const figmaValue = convertDTCGValueToFigmaValue(prim.value, prim.type);
      variable.setValueForMode(defaultModeId, figmaValue);
    } catch (error) {
      console.error(`[PASS1] Failed to set value for ${prim.name}:`, error);
    }

    // Build mapping: "primary.100" -> Figma variable ID
    // Convert slash notation to dot notation for DTCG compatibility
    const dtcgName = prim.name.replace('/', '.');
    dtcgNameToFigmaId.set(dtcgName, variable.id);
  }

  console.log(`[PASS1] Complete. Created ${created}, Updated ${updated}`);
  console.log(`[PASS1] Built ${dtcgNameToFigmaId.size} DTCG name mappings`);

  // PASS 2: Create/update semantic variables (Light and Dark mode values)
  figma.ui.postMessage({
    type: 'IMPORT_PROGRESS',
    message: `Pass 2: Creating ${semantics.length} semantic variables with Light/Dark modes...`,
  });

  for (const sem of semantics) {
    let variable = variablesByName.get(sem.name);

    if (!variable) {
      variable = figma.variables.createVariable(
        sem.name,
        collection,
        sem.type === 'color' ? 'COLOR' : 'FLOAT'
      );
      variablesByName.set(sem.name, variable);
      created++;
      console.log(`[PASS2] Created: ${sem.name}`);
    } else {
      updated++;
    }

    // Set Light and Dark mode values
    try {
      const lightFigmaValue = convertDTCGValueToFigmaValue(sem.lightValue, sem.type);
      variable.setValueForMode(lightModeId, lightFigmaValue);
      const darkFigmaValue = convertDTCGValueToFigmaValue(sem.darkValue, sem.type);
      variable.setValueForMode(darkModeId, darkFigmaValue);
    } catch (error) {
      console.error(`[PASS2] Failed to set value for ${sem.name}:`, error);
    }
  }

  console.log(`[PASS2] Complete. Total created: ${created}, Updated: ${updated}`);

  figma.ui.postMessage({
    type: 'IMPORT_COMPLETE',
    created,
    updated,
    deleted: 0,
  });

  figma.notify(`✓ Import complete! Created: ${created}, Updated: ${updated}`);
}

/**
 * Convert hex color to Figma RGBA format
 * @param hex - Hex color string (e.g., "#3F6900" or "#FFF")
 * @returns Figma RGBA object with values 0-1
 */
function hexToFigmaColor(hex: string): { r: number; g: number; b: number; a: number } {
  // Remove # if present
  const cleanHex = hex.replace('#', '');

  // Handle 3-digit hex (e.g., #FFF -> #FFFFFF)
  const fullHex = cleanHex.length === 3
    ? cleanHex.split('').map(char => char + char).join('')
    : cleanHex;

  // Parse RGB values (0-255)
  const r = parseInt(fullHex.substring(0, 2), 16);
  const g = parseInt(fullHex.substring(2, 4), 16);
  const b = parseInt(fullHex.substring(4, 6), 16);

  // Convert to 0-1 range for Figma
  return {
    r: r / 255,
    g: g / 255,
    b: b / 255,
    a: 1,
  };
}

/**
 * Convert DTCG value to Figma format (for primitives with raw values)
 */
function convertDTCGValueToFigmaValue(value: string, type: string): FigmaVariableValue {
  if (type === 'color') {
    // Convert hex to RGBA
    return hexToFigmaColor(value);
  }

  // For numbers, parse
  if (type === 'number' || type === 'dimension') {
    return parseFloat(value);
  }

  return value;
}

/**
 * Resolve DTCG alias reference to Figma variable alias or raw value
 *
 * Handles:
 * - DTCG aliases: "{primary.100}" -> Figma VARIABLE_ALIAS with actual ID
 * - Raw hex values: "#FFFFFF" -> Figma RGBA
 */
function resolveDTCGAlias(
  value: string,
  type: string,
  dtcgNameToFigmaId: Map<string, string>
): FigmaVariableValue {
  // Check if it's an alias
  if (value.startsWith('{') && value.endsWith('}')) {
    const aliasPath = value.slice(1, -1); // Remove { }
    console.log(`[RESOLVE] Resolving alias: ${aliasPath}`);

    const figmaId = dtcgNameToFigmaId.get(aliasPath);
    if (figmaId) {
      console.log(`[RESOLVE] ✓ Found Figma ID for ${aliasPath}: ${figmaId}`);
      return {
        type: 'VARIABLE_ALIAS',
        id: figmaId,
      };
    } else {
      console.error(`[RESOLVE] ✗ Could not resolve alias: ${aliasPath}`);
      // Fallback to raw value if can't resolve
      throw new Error(`Alias not found: ${aliasPath}`);
    }
  }

  // Not an alias, convert raw value
  return convertDTCGValueToFigmaValue(value, type);
}
