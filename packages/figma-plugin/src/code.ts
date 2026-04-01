/**
 * Figma Plugin Sandbox Code
 *
 * This file runs in Figma's sandbox environment and has access to:
 * - Figma Plugin API (figma.*)
 * - Variables API (figma.variables.*)
 *
 * It communicates with the UI (ui.html) via postMessage.
 */

/**
 * Local TextStyleDef — identical shape to typography.transformer.ts TextStyleDef.
 * Defined here because the plugin sandbox cannot use Node modules; defs arrive
 * pre-computed from the UI.
 */
interface TextStyleDef {
  name: string;
  fontFamily: string;
  fontStyle: string;
  fontSize: number;
  lineHeightPx: number;
  letterSpacing: number;
  tokenPath: string;
}

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

      case 'IMPORT_TEXT_STYLES':
        await handleImportTextStyles(msg.defs);
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
 * Import Variables from figma-variables.json multi-collection format to Figma.
 *
 * Input structure:
 *   {
 *     "$metadata": { ... },
 *     "Primitives":      { "primary/0": { "$type": "color", "$value": { "Value": "#000000" } }, ... },
 *     "Semantic":        { "primary":   { "$type": "color", "$value": { "Light": "#4C662B", "Dark": "#B1D18A" } }, ... },
 *     "Spacing & Shape": { "spacing/md":{ "$type": "number","$value": { "Value": 16 } }, ... }
 *   }
 */
async function handleImport(tokens: unknown) {
  figma.ui.postMessage({
    type: 'IMPORT_PROGRESS',
    message: 'Parsing token file...',
  });

  if (typeof tokens !== 'object' || tokens === null) {
    throw new Error('Invalid tokens: must be an object');
  }

  // Step 1 — Parse as collection file
  const collectionFile = tokens as Record<string, Record<string, any>>;
  const collectionEntries = Object.entries(collectionFile).filter(([key]) => key !== '$metadata');

  console.log(`[IMPORT] Found ${collectionEntries.length} collections: ${collectionEntries.map(([k]) => k).join(', ')}`);

  const existingCollections = await figma.variables.getLocalVariableCollectionsAsync();

  let totalCreated = 0;
  let totalUpdated = 0;
  const results: Array<{ name: string; created: number; updated: number; modes: string[] }> = [];

  // Step 2 — Process each collection
  for (const [collectionName, collectionTokens] of collectionEntries) {
    figma.ui.postMessage({
      type: 'IMPORT_PROGRESS',
      message: `Processing collection: ${collectionName}...`,
    });

    try {
      // 2a — Find existing or create new collection
      let collection = existingCollections.find(c => c.name === collectionName);
      if (!collection) {
        collection = figma.variables.createVariableCollection(collectionName);
        console.log(`[IMPORT] Created collection: ${collectionName}`);
      }

      // 2b — Determine mode names from the first token's $value keys
      const tokenEntries = Object.entries(collectionTokens);
      if (tokenEntries.length === 0) {
        console.warn(`[IMPORT] Collection "${collectionName}" is empty — skipping`);
        continue;
      }
      const firstToken = tokenEntries[0][1] as any;
      const modeNames: string[] = Object.keys(firstToken.$value);
      console.log(`[IMPORT] Collection "${collectionName}" modes: ${modeNames.join(', ')}`);

      // 2c — Rename default mode; add any additional modes
      const defaultMode = collection.modes[0];
      if (defaultMode.name !== modeNames[0]) {
        collection.renameMode(defaultMode.modeId, modeNames[0]);
      }
      for (const modeName of modeNames.slice(1)) {
        const exists = collection.modes.some(m => m.name === modeName);
        if (!exists) {
          collection.addMode(modeName);
        }
      }

      // 2d — Build modeId map (re-read after potential additions)
      const modeIdMap = new Map<string, string>(
        collection.modes.map(m => [m.name, m.modeId])
      );

      // Step 3 — Create/update variables for this collection
      const allVars = await figma.variables.getLocalVariablesAsync();
      const existingVars = allVars.filter(v => v.variableCollectionId === collection!.id);
      const varByName = new Map(existingVars.map(v => [v.name, v]));

      let created = 0;
      let updated = 0;

      for (const [tokenName, tokenData] of tokenEntries) {
        if (tokenName.startsWith('$')) continue;

        const resolvedType = tokenData.$type === 'color' ? 'COLOR' : 'FLOAT';

        let variable = varByName.get(tokenName);
        if (!variable) {
          variable = figma.variables.createVariable(tokenName, collection!, resolvedType);
          created++;
        } else {
          updated++;
        }

        for (const [modeName, modeId] of modeIdMap) {
          const rawValue = tokenData.$value[modeName];
          if (rawValue === undefined) continue;

          const figmaValue = resolvedType === 'COLOR'
            ? hexToFigmaColor(rawValue as string)
            : (rawValue as number);

          variable.setValueForMode(modeId, figmaValue);
        }
      }

      console.log(`[IMPORT] "${collectionName}": created ${created}, updated ${updated}`);
      totalCreated += created;
      totalUpdated += updated;
      results.push({ name: collectionName, created, updated, modes: modeNames });

    } catch (error) {
      console.error(`[IMPORT] Failed to process collection "${collectionName}":`, error);
      results.push({ name: collectionName, created: 0, updated: 0, modes: [] });
    }
  }

  // Step 4 — Post completion
  figma.ui.postMessage({
    type: 'IMPORT_COMPLETE',
    collections: results,
    totalCreated,
    totalUpdated,
  });

  figma.notify(`✓ Import complete! Created: ${totalCreated}, Updated: ${totalUpdated}`);
}

/**
 * Import text styles from pre-computed TextStyleDef array.
 * Fonts are batch-loaded before any createTextStyle() call.
 */
async function handleImportTextStyles(defs: unknown) {
  // 1. Validate
  if (!Array.isArray(defs) || defs.length === 0) {
    throw new Error('IMPORT_TEXT_STYLES requires a non-empty array of TextStyleDef objects');
  }

  // 2. Cast
  const styleDefs = defs as TextStyleDef[];

  // 3. Batch-load all unique font pairs before any createTextStyle() call
  const uniqueFonts = [
    ...new Map(
      styleDefs.map(d => [d.fontFamily + '|' + d.fontStyle,
                          { family: d.fontFamily, style: d.fontStyle }])
    ).values()
  ];
  await Promise.all(uniqueFonts.map(f => figma.loadFontAsync(f)));

  // 4. Build idempotency set
  const existing = new Set(
    (await figma.getLocalTextStylesAsync()).map(s => s.name)
  );

  // 5. Loop and create missing styles
  const created: string[] = [];
  const skipped: string[] = [];
  for (const def of styleDefs) {
    if (existing.has(def.name)) { skipped.push(def.name); continue; }
    const style = figma.createTextStyle();
    style.name          = def.name;
    style.fontName      = { family: def.fontFamily, style: def.fontStyle };
    style.fontSize      = def.fontSize;
    style.lineHeight    = { value: def.lineHeightPx, unit: 'PIXELS' };
    style.letterSpacing = { value: def.letterSpacing, unit: 'PIXELS' };
    style.description   = 'token: ' + def.tokenPath;
    created.push(def.name);
  }

  // 6. Post completion
  figma.ui.postMessage({ type: 'IMPORT_TEXT_STYLES_COMPLETE', created, skipped });

  // 7. Notify
  figma.notify('✓ Text styles: ' + created.length + ' created, ' + skipped.length + ' skipped');
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

