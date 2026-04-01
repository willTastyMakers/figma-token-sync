# Figma Plugin API Skill

## ⚠️ Architecture Note

**The Figma Variables REST API requires an Enterprise plan.** This skill documents
the **Figma Plugin API** approach instead, which works on all plan tiers.

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

---

## Text Styles

### Critical Limitation

**`setBoundVariable` on TextStyle is NOT supported in the Figma Plugin API.**
Font properties (fontSize, fontWeight, lineHeight, letterSpacing) cannot be
programmatically bound to variables on a text style. They must be set as raw
values. Variable binding to text styles must be done manually in the Figma UI.

### Font Must Be Loaded First

Always call `figma.loadFontAsync` before setting any font property. Figma will
throw synchronously if the font is not loaded.

### Creating a Single Text Style

```typescript
async function createTextStyle(
  name: string,           // 'Headline/Small/SemiBold' — slash creates hierarchy
  fontFamily: string,     // 'Fraunces' — figmaName only, no CSS stack
  fontStyle: string,      // 'SemiBold' — must match Figma exactly
  fontSize: number,       // raw number, no units
  lineHeightPx: number,   // raw number in pixels
  letterSpacing: number,  // raw number in pixels
  description: string     // 'token: typography.scale.headlineSmall.weights.semiBold'
): Promise<TextStyle> {
  await figma.loadFontAsync({ family: fontFamily, style: fontStyle });

  const style = figma.createTextStyle();
  style.name          = name;
  style.fontName      = { family: fontFamily, style: fontStyle };
  style.fontSize      = fontSize;
  style.lineHeight    = { value: lineHeightPx, unit: 'PIXELS' };
  style.letterSpacing = { value: letterSpacing, unit: 'PIXELS' };
  style.description   = description;
  return style;
}
```

### Description Field — Semantic Bridge

`setBoundVariable` is unsupported on text styles, so the description field is
the only programmatic link back to the design system.

**Always use this exact format:**
```
token: typography.scale.{scaleName}.weights.{weightName}
```

Examples:
- `token: typography.scale.headlineSmall.weights.semiBold`
- `token: typography.scale.bodyLarge.weights.regular`
- `token: typography.scale.labelMedium.weights.bold`

When a Figma MCP agent reads a text node it reads `style.description` to resolve
back to the DDS token path, then looks up the full `TypeScaleStep` in the NPM
package or Storybook MCP.

### Weight Name → Figma Font Style String

Weight labels come from `FontConfig.weightMap` in the DDS contract — never
hardcode them. The mapping for our two typefaces:

| fontWeight | Fraunces style | Poppins style |
|---|---|---|
| '100' | Thin | Thin |
| '300' | Light | Light |
| '400' | Regular | Regular |
| '500' | Medium | Medium |
| '600' | SemiBold | SemiBold |
| '700' | Bold | Bold |

Always read from the contract:
```typescript
const fontStyle = fontConfig.weightMap[variant.fontWeight]; // 'SemiBold'
```

### Creating a Full Type Ramp (idempotent)

```typescript
interface TextStyleDef {
  name: string;         // e.g. 'Headline/Small/SemiBold'
  fontFamily: string;   // figmaName, e.g. 'Fraunces'
  fontStyle: string;    // Figma style string, e.g. 'SemiBold'
  fontSize: number;
  lineHeightPx: number;
  letterSpacing: number;
  tokenPath: string;    // e.g. 'typography.scale.headlineSmall.weights.semiBold'
}

async function createTypeRamp(
  defs: TextStyleDef[]
): Promise<{ created: string[]; skipped: string[] }> {
  // 1. Load all unique fonts first — batch to avoid repeated async calls
  const uniqueFonts = new Set(
    defs.map(d => JSON.stringify({ family: d.fontFamily, style: d.fontStyle }))
  );
  await Promise.all([...uniqueFonts].map(f => figma.loadFontAsync(JSON.parse(f))));

  // 2. Build existing style name set for idempotency
  const existing = new Set(
    (await figma.getLocalTextStylesAsync()).map(s => s.name)
  );

  const created: string[] = [];
  const skipped: string[] = [];

  // 3. Create only missing styles
  for (const def of defs) {
    if (existing.has(def.name)) {
      skipped.push(def.name);
      continue;
    }

    const style = figma.createTextStyle();
    style.name          = def.name;
    style.fontName      = { family: def.fontFamily, style: def.fontStyle };
    style.fontSize      = def.fontSize;
    style.lineHeight    = { value: def.lineHeightPx, unit: 'PIXELS' };
    style.letterSpacing = { value: def.letterSpacing, unit: 'PIXELS' };
    style.description   = `token: ${def.tokenPath}`;
    created.push(def.name);
  }

  return { created, skipped };
}
```

### Updating an Existing Text Style

```typescript
async function updateTextStyle(
  styleName: string,
  updates: Partial<TextStyleDef>
): Promise<boolean> {
  const styles = await figma.getLocalTextStylesAsync();
  const style = styles.find(s => s.name === styleName);
  if (!style) return false;

  if (updates.fontFamily && updates.fontStyle) {
    await figma.loadFontAsync({ family: updates.fontFamily, style: updates.fontStyle });
    style.fontName = { family: updates.fontFamily, style: updates.fontStyle };
  }
  if (updates.fontSize      !== undefined) style.fontSize      = updates.fontSize;
  if (updates.lineHeightPx  !== undefined) style.lineHeight    = { value: updates.lineHeightPx, unit: 'PIXELS' };
  if (updates.letterSpacing !== undefined) style.letterSpacing = { value: updates.letterSpacing, unit: 'PIXELS' };
  if (updates.tokenPath     !== undefined) style.description   = `token: ${updates.tokenPath}`;
  return true;
}
```

### Listing Text Styles (for export / audit)

```typescript
const styles = await figma.getLocalTextStylesAsync();
const result = styles.map(s => ({
  id:            s.id,
  name:          s.name,
  description:   s.description,  // 'token: typography.scale.*.weights.*'
  fontSize:      s.fontSize,
  fontName:      s.fontName,      // { family: 'Fraunces', style: 'SemiBold' }
  lineHeight:    s.lineHeight,
  letterSpacing: s.letterSpacing,
}));
```

### Text Style Name Convention

Names use slash hierarchy: `{Category}/{Size}/{WeightLabel}`

```
Display/Large/Regular       Display/Large/SemiBold
Headline/Small/Light        Headline/Small/Regular      Headline/Small/SemiBold
Title/Medium/Regular        Title/Medium/Medium         Title/Medium/SemiBold    Title/Medium/Bold
Body/Large/Light            Body/Large/Regular          Body/Large/Medium        Body/Large/SemiBold
Label/Small/Light           Label/Small/Medium          Label/Small/SemiBold     Label/Small/Bold
```

Full 56-style list: see `tokens/typography-text-styles.manifest.json` in DDS repo.

---

## Best Practices

1. **Always `loadFontAsync` before any text style operation** — no exception
2. **Batch font loads** — collect all unique `{ family, style }` pairs, load in parallel
3. **Check for existing styles before creating** — idempotency prevents duplicates
4. **Never hardcode weight strings** — always read from `FontConfig.weightMap`
5. **Always set description on text styles** — it is the only semantic link back to DDS
6. **Use async/await for all variable operations** — they are all asynchronous
7. **Preserve scopes when updating variables** — don't wipe them on update
8. **Batch variable operations** — minimize individual API calls
9. **Handle aliases** — check for and properly resolve variable references
10. **Validate types** — ensure values match the variable's resolvedType
