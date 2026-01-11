# Figma Plugin API - Variables Skill

## ⚠️ Architecture Note

**The Figma Variables REST API requires an Enterprise plan.** This skill documents the **Figma Plugin API** approach instead, which works on all plan tiers.

## Overview

This skill provides knowledge for working with Figma's Plugin API to read and write design tokens via Variables. The Plugin API has full access to Variables regardless of your Figma plan.

## Plugin vs REST API

| Feature | Plugin API | REST API |
|---------|-----------|----------|
| Plan Required | Any (Free, Pro, Org, Enterprise) | Enterprise only |
| Access Method | Runs inside Figma | External HTTP calls |
| Authentication | User's Figma session | Personal Access Token |
| Real-time | Yes (in Figma context) | No |
| CI/CD Integration | Requires file export/import | Direct API calls |

## Plugin API Endpoints

### Get All Variables
```typescript
// Get all local variable collections
const collections = await figma.variables.getLocalVariableCollectionsAsync();

// Get all local variables  
const variables = await figma.variables.getLocalVariablesAsync();

// Filter by type
const colorVars = await figma.variables.getLocalVariablesAsync('COLOR');
const floatVars = await figma.variables.getLocalVariablesAsync('FLOAT');
const stringVars = await figma.variables.getLocalVariablesAsync('STRING');
const boolVars = await figma.variables.getLocalVariablesAsync('BOOLEAN');
```

### Get Specific Variable
```typescript
const variable = await figma.variables.getVariableByIdAsync(variableId);
```

### Create Collection
```typescript
const collection = figma.variables.createVariableCollection('Primitives');

// Add modes
collection.addMode('Dark');  // Light is default
collection.renameMode(collection.defaultModeId, 'Light');
```

### Create Variable
```typescript
const variable = figma.variables.createVariable(
  'primary/500',           // name (use / for hierarchy)
  collection.id,           // collectionId
  'COLOR'                  // resolvedType: 'BOOLEAN' | 'COLOR' | 'FLOAT' | 'STRING'
);

// Set value for a mode
variable.setValueForMode(modeId, { r: 0.4, g: 0.31, b: 0.64, a: 1 });
```

### Update Variable
```typescript
const variable = await figma.variables.getVariableByIdAsync(id);

// Update value
variable.setValueForMode(modeId, newValue);

// Update name
variable.name = 'new/path/name';

// Update description
variable.description = 'Primary brand color';

// Update scopes
variable.scopes = ['FRAME_FILL', 'SHAPE_FILL', 'TEXT_FILL'];
```

### Delete Variable
```typescript
const variable = await figma.variables.getVariableByIdAsync(id);
variable.remove();
```

### Variable Aliases (References)
```typescript
// Create an alias to another variable
const aliasValue: VariableAlias = {
  type: 'VARIABLE_ALIAS',
  id: otherVariable.id
};

variable.setValueForMode(modeId, aliasValue);

// Check if a value is an alias
function isAlias(value: VariableValue): value is VariableAlias {
  return typeof value === 'object' && 'type' in value && value.type === 'VARIABLE_ALIAS';
}

// Resolve an alias
if (isAlias(value)) {
  const resolvedVar = await figma.variables.getVariableByIdAsync(value.id);
  // Get the actual value from resolvedVar
}
```

## Variable Types

```typescript
type VariableResolvedDataType = 'BOOLEAN' | 'COLOR' | 'FLOAT' | 'STRING';

type VariableValue = 
  | boolean                    // BOOLEAN
  | RGB                        // COLOR (no alpha)
  | RGBA                       // COLOR (with alpha)
  | number                     // FLOAT
  | string                     // STRING
  | VariableAlias;             // Reference to another variable

interface RGB {
  r: number;  // 0-1
  g: number;  // 0-1
  b: number;  // 0-1
}

interface RGBA extends RGB {
  a: number;  // 0-1
}

interface VariableAlias {
  type: 'VARIABLE_ALIAS';
  id: string;
}
```

## Collections and Modes

### Collection Structure
```typescript
interface VariableCollection {
  id: string;
  name: string;
  modes: Array<{ modeId: string; name: string }>;
  defaultModeId: string;
  variableIds: string[];
  hiddenFromPublishing: boolean;
  
  // Methods
  addMode(name: string): string;  // Returns new modeId
  removeMode(modeId: string): void;
  renameMode(modeId: string, newName: string): void;
  remove(): void;
}
```

### Working with Modes
```typescript
// Get all modes for a collection
const collection = await figma.variables.getVariableCollectionByIdAsync(collectionId);
const modes = collection.modes;  // [{ modeId: '123', name: 'Light' }, { modeId: '456', name: 'Dark' }]

// Get variable values for all modes
const variable = await figma.variables.getVariableByIdAsync(varId);
const valuesByMode = variable.valuesByMode;
// { '123': '#ffffff', '456': '#1a1a1a' }
```

## Variable Scopes

Scopes control where a variable can be used:

```typescript
type VariableScope =
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
```

## Color Conversion Utilities

```typescript
// Figma uses 0-1 range, hex uses 0-255
function figmaColorToHex(color: RGBA): string {
  const toHex = (n: number) => Math.round(n * 255).toString(16).padStart(2, '0');
  const hex = `#${toHex(color.r)}${toHex(color.g)}${toHex(color.b)}`;
  if (color.a !== undefined && color.a < 1) {
    return hex + toHex(color.a);
  }
  return hex;
}

function hexToFigmaColor(hex: string): RGBA {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.slice(0, 2), 16) / 255;
  const g = parseInt(clean.slice(2, 4), 16) / 255;
  const b = parseInt(clean.slice(4, 6), 16) / 255;
  const a = clean.length === 8 ? parseInt(clean.slice(6, 8), 16) / 255 : 1;
  return { r, g, b, a };
}
```

## Plugin Manifest

```json
{
  "name": "Figma Token Sync",
  "id": "figma-token-sync-plugin",
  "api": "1.0.0",
  "main": "code.js",
  "ui": "ui.html",
  "editorType": ["figma"],
  "capabilities": ["variablesRead", "variablesWrite"],
  "permissions": ["currentuser"]
}
```

**Required Capabilities:**
- `variablesRead` — Read variables and collections
- `variablesWrite` — Create, update, delete variables

## Plugin Code Structure

### code.ts (Sandbox)
```typescript
// This runs in Figma's sandbox, has access to Plugin API
figma.showUI(__html__, { width: 400, height: 600 });

figma.ui.onmessage = async (msg) => {
  if (msg.type === 'EXPORT') {
    const collections = await figma.variables.getLocalVariableCollectionsAsync();
    const variables = await figma.variables.getLocalVariablesAsync();
    figma.ui.postMessage({ type: 'EXPORT_DATA', collections, variables });
  }
  
  if (msg.type === 'IMPORT') {
    await importVariables(msg.tokens);
    figma.ui.postMessage({ type: 'IMPORT_COMPLETE' });
  }
};
```

### ui.tsx (UI)
```typescript
// This runs in an iframe, can use React, etc.
// Communicates with code.ts via postMessage

parent.postMessage({ pluginMessage: { type: 'EXPORT' } }, '*');

window.onmessage = (event) => {
  const msg = event.data.pluginMessage;
  if (msg.type === 'EXPORT_DATA') {
    // Handle export data
  }
};
```

## Export Flow Pattern

```typescript
// code.ts
async function exportVariablesToDTCG() {
  const collections = await figma.variables.getLocalVariableCollectionsAsync();
  const variables = await figma.variables.getLocalVariablesAsync();
  
  // Build collection map
  const collectionMap = new Map(collections.map(c => [c.id, c]));
  
  // Transform to DTCG
  const tokens: DTCGTokens = {};
  
  for (const variable of variables) {
    const collection = collectionMap.get(variable.variableCollectionId);
    if (!collection) continue;
    
    const collectionName = collection.name;
    const path = variable.name.split('/');
    
    // Build nested structure
    let current = tokens[collectionName] ??= {};
    for (let i = 0; i < path.length - 1; i++) {
      current = current[path[i]] ??= {};
    }
    
    const tokenName = path[path.length - 1];
    current[tokenName] = {
      $type: mapFigmaType(variable.resolvedType),
      $value: variable.valuesByMode[collection.defaultModeId],
      $description: variable.description || undefined,
    };
  }
  
  return tokens;
}

function mapFigmaType(type: VariableResolvedDataType): string {
  switch (type) {
    case 'COLOR': return 'color';
    case 'FLOAT': return 'number';
    case 'STRING': return 'string';
    case 'BOOLEAN': return 'boolean';
  }
}
```

## Import Flow Pattern

```typescript
// code.ts
async function importVariablesFromDTCG(tokens: DTCGTokens) {
  const existingCollections = await figma.variables.getLocalVariableCollectionsAsync();
  const existingVars = await figma.variables.getLocalVariablesAsync();
  
  // Build lookup maps
  const collectionByName = new Map(existingCollections.map(c => [c.name, c]));
  const varByPath = new Map(existingVars.map(v => {
    const collection = collectionByName.get(/* find collection name */);
    return [`${collection?.name}/${v.name}`, v];
  }));
  
  // Process tokens
  for (const [collectionName, collectionTokens] of Object.entries(tokens)) {
    let collection = collectionByName.get(collectionName);
    
    if (!collection) {
      collection = figma.variables.createVariableCollection(collectionName);
      collectionByName.set(collectionName, collection);
    }
    
    await processTokenGroup(collection, collectionTokens, '', varByPath);
  }
}

async function processTokenGroup(
  collection: VariableCollection,
  tokens: DTCGTokens,
  prefix: string,
  existingVars: Map<string, Variable>
) {
  for (const [key, value] of Object.entries(tokens)) {
    const path = prefix ? `${prefix}/${key}` : key;
    const fullPath = `${collection.name}/${path}`;
    
    if ('$type' in value && '$value' in value) {
      // It's a token
      const existing = existingVars.get(fullPath);
      
      if (existing) {
        // Update
        existing.setValueForMode(collection.defaultModeId, convertValue(value));
      } else {
        // Create
        const variable = figma.variables.createVariable(
          path,
          collection.id,
          mapDTCGType(value.$type)
        );
        variable.setValueForMode(collection.defaultModeId, convertValue(value));
      }
    } else {
      // It's a group, recurse
      await processTokenGroup(collection, value as DTCGTokens, path, existingVars);
    }
  }
}
```

## Best Practices

1. **Use async/await** — All variable operations are asynchronous
2. **Batch operations** — Minimize individual API calls
3. **Handle aliases** — Check for and properly resolve variable references
4. **Preserve metadata** — Keep descriptions, scopes when updating
5. **Validate types** — Ensure values match the variable's resolvedType
6. **Test incrementally** — Test export before import, then round-trip

## References

- [Figma Plugin API - Variables](https://www.figma.com/plugin-docs/api/figma-variables/)
- [Figma Plugin API - Variable](https://www.figma.com/plugin-docs/api/Variable/)
- [Figma Plugin API - VariableCollection](https://www.figma.com/plugin-docs/api/VariableCollection/)
- [Figma Plugin Development Guide](https://www.figma.com/plugin-docs/)
