# Figma ↔ Discourser Design System Token Sync Specification


## Overview

This document defines the authoritative structure for bidirectional token synchronization between:
- **Figma Variables** (design source of truth for visual properties)
- **Discourser-Design-System** (code implementation using PandaCSS + Park UI)

The sync must produce valid **DTCG (Design Tokens Community Group)** format as an intermediate representation.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              FIGMA                                           │
│                                                                              │
│  Collections:                                                                │
│  ├── Primitives/Colors (tonal palettes)                                     │
│  ├── Primitives/Spacing                                                     │
│  ├── Primitives/Typography                                                  │
│  ├── Semantic/Colors (light mode)                                           │
│  ├── Semantic/Colors (dark mode)                                            │
│  └── Component/Tokens                                                       │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                          figma-token-sync                                     
                            (export/import)                                    
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         DTCG JSON FILES                                      │
│                                                                              │
│  tokens/                                                                     │
│  ├── primitives/                                                            │
│  │   ├── colors.json        (tonal palettes)                                │
│  │   ├── spacing.json                                                       │
│  │   └── typography.json                                                    │
│  ├── semantic/                                                              │
│  │   ├── colors.light.json                                                  │
│  │   └── colors.dark.json                                                   │
│  └── components/                                                            │
│      └── tokens.json                                                        │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                          transform script                                     
                     (dtcg-to-design-language.ts)                             
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                    DESIGN LANGUAGE CONTRACT                                  │
│                    (material3.language.ts)                                   │
│                                                                              │
│  DesignLanguageContract {                                                   │
│    colors: ColorPalettes      → Consumed by m3-primary.ts, etc.             │
│    semantic: SemanticColors   → Consumed by semantic-tokens.ts              │
│    typography: TypographyConfig                                             │
│    spacing: SpacingScale                                                    │
│    ...                                                                      │
│  }                                                                          │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                          PandaCSS build                                       
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                    PANDACSS OUTPUT                                           │
│                    (styled-system/)                                          │
│                                                                              │
│  CSS Variables, TypeScript types, recipes                                   │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Part 1: Figma Variable Structure

### Collection: `Primitives/Colors`

Contains **tonal palettes** following Material Design 3 specification.
Each color has 13 tonal steps: 0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 95, 99, 100

#### Variable Naming Convention
```
{palette}/{tone}
```

#### Required Variables

| Variable Name | Type | Example Value | Description |
|--------------|------|---------------|-------------|
| `primary/0` | Color | `#000000` | Darkest primary tone |
| `primary/10` | Color | `#102000` | |
| `primary/20` | Color | `#1F3700` | |
| `primary/30` | Color | `#2F4F00` | |
| `primary/40` | Color | `#3F6900` | Key color (often primary action) |
| `primary/50` | Color | `#518500` | |
| `primary/60` | Color | `#64A104` | |
| `primary/70` | Color | `#7DBD2A` | |
| `primary/80` | Color | `#97D945` | Dark mode primary |
| `primary/90` | Color | `#B2F65F` | Light mode container |
| `primary/95` | Color | `#D2FF9B` | |
| `primary/99` | Color | `#F9FFE9` | Lightest primary tone |
| `primary/100` | Color | `#FFFFFF` | White |

**Repeat pattern for:**
- `secondary/0` through `secondary/100`
- `tertiary/0` through `tertiary/100`
- `neutral/0` through `neutral/100`
- `neutralVariant/0` through `neutralVariant/100`
- `error/0` through `error/100`

#### Total Primitive Color Variables: 78 (6 palettes × 13 tones)

---

### Collection: `Semantic/Colors`

Contains **semantic color tokens** that reference primitives.
Uses **two modes**: `light` and `dark`

#### Variable Naming Convention
```
{role}
{role}/{variant}
```

#### Required Variables (with mode values)

| Variable Name | Light Mode Value | Dark Mode Value |
|--------------|------------------|-----------------|
| `primary` | `{Primitives/Colors.primary/40}` | `{Primitives/Colors.primary/80}` |
| `onPrimary` | `{Primitives/Colors.primary/100}` | `{Primitives/Colors.primary/20}` |
| `primaryContainer` | `{Primitives/Colors.primary/90}` | `{Primitives/Colors.primary/30}` |
| `onPrimaryContainer` | `{Primitives/Colors.primary/10}` | `{Primitives/Colors.primary/90}` |
| `secondary` | `{Primitives/Colors.secondary/40}` | `{Primitives/Colors.secondary/80}` |
| `onSecondary` | `{Primitives/Colors.secondary/100}` | `{Primitives/Colors.secondary/20}` |
| `secondaryContainer` | `{Primitives/Colors.secondary/90}` | `{Primitives/Colors.secondary/30}` |
| `onSecondaryContainer` | `{Primitives/Colors.secondary/10}` | `{Primitives/Colors.secondary/90}` |
| `tertiary` | `{Primitives/Colors.tertiary/40}` | `{Primitives/Colors.tertiary/80}` |
| `onTertiary` | `{Primitives/Colors.tertiary/100}` | `{Primitives/Colors.tertiary/20}` |
| `tertiaryContainer` | `{Primitives/Colors.tertiary/90}` | `{Primitives/Colors.tertiary/30}` |
| `onTertiaryContainer` | `{Primitives/Colors.tertiary/10}` | `{Primitives/Colors.tertiary/90}` |
| `error` | `{Primitives/Colors.error/40}` | `{Primitives/Colors.error/80}` |
| `onError` | `{Primitives/Colors.error/100}` | `{Primitives/Colors.error/20}` |
| `errorContainer` | `{Primitives/Colors.error/90}` | `{Primitives/Colors.error/30}` |
| `onErrorContainer` | `{Primitives/Colors.error/10}` | `{Primitives/Colors.error/90}` |
| `surface` | `{Primitives/Colors.neutral/99}` | `{Primitives/Colors.neutral/10}` |
| `onSurface` | `{Primitives/Colors.neutral/10}` | `{Primitives/Colors.neutral/90}` |
| `surfaceVariant` | `{Primitives/Colors.neutralVariant/90}` | `{Primitives/Colors.neutralVariant/30}` |
| `onSurfaceVariant` | `{Primitives/Colors.neutralVariant/30}` | `{Primitives/Colors.neutralVariant/80}` |
| `surfaceContainerLowest` | `{Primitives/Colors.neutral/100}` | `{Primitives/Colors.neutral/4}` |
| `surfaceContainerLow` | `{Primitives/Colors.neutral/96}` | `{Primitives/Colors.neutral/10}` |
| `surfaceContainer` | `{Primitives/Colors.neutral/94}` | `{Primitives/Colors.neutral/12}` |
| `surfaceContainerHigh` | `{Primitives/Colors.neutral/92}` | `{Primitives/Colors.neutral/17}` |
| `surfaceContainerHighest` | `{Primitives/Colors.neutral/90}` | `{Primitives/Colors.neutral/22}` |
| `outline` | `{Primitives/Colors.neutralVariant/50}` | `{Primitives/Colors.neutralVariant/60}` |
| `outlineVariant` | `{Primitives/Colors.neutralVariant/80}` | `{Primitives/Colors.neutralVariant/30}` |
| `inverseSurface` | `{Primitives/Colors.neutral/20}` | `{Primitives/Colors.neutral/90}` |
| `inverseOnSurface` | `{Primitives/Colors.neutral/95}` | `{Primitives/Colors.neutral/20}` |
| `inversePrimary` | `{Primitives/Colors.primary/80}` | `{Primitives/Colors.primary/40}` |
| `scrim` | `{Primitives/Colors.neutral/0}` | `{Primitives/Colors.neutral/0}` |
| `shadow` | `{Primitives/Colors.neutral/0}` | `{Primitives/Colors.neutral/0}` |

#### Total Semantic Color Variables: 31

---

### Collection: `Primitives/Spacing`

| Variable Name | Type | Value | Description |
|--------------|------|-------|-------------|
| `none` | Number | `0` | No spacing |
| `xxs` | Number | `2` | Extra extra small |
| `xs` | Number | `4` | Extra small |
| `sm` | Number | `8` | Small |
| `md` | Number | `16` | Medium (base unit) |
| `lg` | Number | `24` | Large |
| `xl` | Number | `32` | Extra large |
| `xxl` | Number | `48` | Extra extra large |
| `xxxl` | Number | `64` | Extra extra extra large |

---

### Collection: `Primitives/Typography`

#### Font Families
| Variable Name | Type | Value |
|--------------|------|-------|
| `fontFamily/display` | String | `Fraunces` |
| `fontFamily/body` | String | `Poppins` |
| `fontFamily/mono` | String | `JetBrains Mono` |

#### Type Scale (M3)
Each type style needs: fontSize, lineHeight, fontWeight, letterSpacing

| Variable Name | fontSize | lineHeight | fontWeight | letterSpacing |
|--------------|----------|------------|------------|---------------|
| `displayLarge` | 57 | 64 | 400 | -0.25 |
| `displayMedium` | 45 | 52 | 400 | 0 |
| `displaySmall` | 36 | 44 | 400 | 0 |
| `headlineLarge` | 32 | 40 | 400 | 0 |
| `headlineMedium` | 28 | 36 | 400 | 0 |
| `headlineSmall` | 24 | 32 | 400 | 0 |
| `titleLarge` | 22 | 28 | 500 | 0 |
| `titleMedium` | 16 | 24 | 500 | 0.15 |
| `titleSmall` | 14 | 20 | 500 | 0.1 |
| `bodyLarge` | 16 | 24 | 400 | 0.5 |
| `bodyMedium` | 14 | 20 | 400 | 0.25 |
| `bodySmall` | 12 | 16 | 400 | 0.4 |
| `labelLarge` | 14 | 20 | 500 | 0.1 |
| `labelMedium` | 12 | 16 | 500 | 0.5 |
| `labelSmall` | 11 | 16 | 500 | 0.5 |

---

## Part 2: DTCG Output Structure

### File: `tokens/primitives/colors.json`

```json
{
  "$schema": "https://design-tokens.org/schema.json",
  "primary": {
    "$type": "color",
    "0": { "$value": "#000000" },
    "10": { "$value": "#102000" },
    "20": { "$value": "#1F3700" },
    "30": { "$value": "#2F4F00" },
    "40": { "$value": "#3F6900" },
    "50": { "$value": "#518500" },
    "60": { "$value": "#64A104" },
    "70": { "$value": "#7DBD2A" },
    "80": { "$value": "#97D945" },
    "90": { "$value": "#B2F65F" },
    "95": { "$value": "#D2FF9B" },
    "99": { "$value": "#F9FFE9" },
    "100": { "$value": "#FFFFFF" }
  },
  "secondary": {
    "$type": "color",
    "0": { "$value": "#000000" },
    "10": { "$value": "#121F04" },
    "...": "..."
  },
  "tertiary": { "...": "..." },
  "neutral": { "...": "..." },
  "neutralVariant": { "...": "..." },
  "error": { "...": "..." }
}
```

**Key Points:**
- `$type` at group level (inherited by children per DTCG spec)
- Numeric keys as strings (`"40"` not `40`)
- No `$value` at same level as children (DTCG compliance)

---

### File: `tokens/semantic/colors.light.json`

```json
{
  "$schema": "https://design-tokens.org/schema.json",
  "primary": {
    "$type": "color",
    "$value": "{primary.40}"
  },
  "onPrimary": {
    "$type": "color",
    "$value": "{primary.100}"
  },
  "primaryContainer": {
    "$type": "color",
    "$value": "{primary.90}"
  },
  "onPrimaryContainer": {
    "$type": "color",
    "$value": "{primary.10}"
  },
  "surface": {
    "$type": "color",
    "$value": "{neutral.99}"
  },
  "surfaceContainer": {
    "$type": "color",
    "$value": "{neutral.94}"
  }
}
```

---

### File: `tokens/semantic/colors.dark.json`

```json
{
  "$schema": "https://design-tokens.org/schema.json",
  "primary": {
    "$type": "color",
    "$value": "{primary.80}"
  },
  "onPrimary": {
    "$type": "color",
    "$value": "{primary.20}"
  },
  "primaryContainer": {
    "$type": "color",
    "$value": "{primary.30}"
  },
  "onPrimaryContainer": {
    "$type": "color",
    "$value": "{primary.90}"
  },
  "surface": {
    "$type": "color",
    "$value": "{neutral.10}"
  }
}
```

---

### File: `tokens/primitives/spacing.json`

```json
{
  "$schema": "https://design-tokens.org/schema.json",
  "spacing": {
    "$type": "dimension",
    "none": { "$value": { "value": 0, "unit": "px" } },
    "xxs": { "$value": { "value": 2, "unit": "px" } },
    "xs": { "$value": { "value": 4, "unit": "px" } },
    "sm": { "$value": { "value": 8, "unit": "px" } },
    "md": { "$value": { "value": 16, "unit": "px" } },
    "lg": { "$value": { "value": 24, "unit": "px" } },
    "xl": { "$value": { "value": 32, "unit": "px" } },
    "xxl": { "$value": { "value": 48, "unit": "px" } },
    "xxxl": { "$value": { "value": 64, "unit": "px" } }
  }
}
```

---

## Part 3: Transform to DesignLanguageContract

### File: `scripts/dtcg-to-design-language.ts`

```typescript
import type { 
  DesignLanguageContract, 
  TonalPalette, 
  SemanticColors,
  ColorPalettes 
} from '../src/contracts/design-language.contract';

// DTCG Types
interface DTCGColorToken {
  $type?: 'color';
  $value: string;
}

interface DTCGColorGroup {
  $type?: 'color';
  [key: string]: DTCGColorToken | string | undefined;
}

interface DTCGPrimitivesColors {
  primary: DTCGColorGroup;
  secondary: DTCGColorGroup;
  tertiary: DTCGColorGroup;
  neutral: DTCGColorGroup;
  neutralVariant: DTCGColorGroup;
  error: DTCGColorGroup;
}

// Tonal steps as defined in M3
const TONAL_STEPS = ['0', '10', '20', '30', '40', '50', '60', '70', '80', '90', '95', '99', '100'] as const;

/**
 * Extract hex value from DTCG token
 */
function extractValue(token: DTCGColorToken | undefined): string {
  if (!token || typeof token === 'string') {
    throw new Error(`Invalid token: ${JSON.stringify(token)}`);
  }
  return token.$value;
}

/**
 * Transform DTCG color group to TonalPalette
 */
function toTonalPalette(group: DTCGColorGroup): TonalPalette {
  const palette: Partial<TonalPalette> = {};
  
  for (const step of TONAL_STEPS) {
    const token = group[step] as DTCGColorToken;
    if (token && token.$value) {
      palette[parseInt(step) as keyof TonalPalette] = token.$value;
    }
  }
  
  // Validate all steps present
  for (const step of TONAL_STEPS) {
    if (!palette[parseInt(step) as keyof TonalPalette]) {
      throw new Error(`Missing tonal step: ${step}`);
    }
  }
  
  return palette as TonalPalette;
}

/**
 * Transform DTCG primitives to ColorPalettes
 */
function toColorPalettes(primitives: DTCGPrimitivesColors): ColorPalettes {
  return {
    primary: toTonalPalette(primitives.primary),
    secondary: toTonalPalette(primitives.secondary),
    tertiary: toTonalPalette(primitives.tertiary),
    neutral: toTonalPalette(primitives.neutral),
    neutralVariant: toTonalPalette(primitives.neutralVariant),
    error: toTonalPalette(primitives.error),
  };
}

/**
 * Resolve DTCG alias reference to actual hex value
 * Input: "{primary.40}" 
 * Output: "#3F6900"
 */
function resolveAlias(
  alias: string, 
  primitives: DTCGPrimitivesColors
): string {
  // Check if it's an alias
  if (!alias.startsWith('{') || !alias.endsWith('}')) {
    return alias; // Already a raw value
  }
  
  const path = alias.slice(1, -1); // Remove { }
  const [palette, tone] = path.split('.');
  
  const group = primitives[palette as keyof DTCGPrimitivesColors];
  if (!group) {
    throw new Error(`Unknown palette: ${palette}`);
  }
  
  const token = group[tone] as DTCGColorToken;
  if (!token || !token.$value) {
    throw new Error(`Unknown tone: ${palette}.${tone}`);
  }
  
  return token.$value;
}

/**
 * Transform DTCG semantic tokens to SemanticColors
 */
function toSemanticColors(
  semantic: Record<string, DTCGColorToken>,
  primitives: DTCGPrimitivesColors
): SemanticColors {
  const resolve = (key: string): string => {
    const token = semantic[key];
    if (!token) {
      throw new Error(`Missing semantic token: ${key}`);
    }
    return resolveAlias(token.$value, primitives);
  };
  
  return {
    primary: resolve('primary'),
    onPrimary: resolve('onPrimary'),
    primaryContainer: resolve('primaryContainer'),
    onPrimaryContainer: resolve('onPrimaryContainer'),
    secondary: resolve('secondary'),
    onSecondary: resolve('onSecondary'),
    secondaryContainer: resolve('secondaryContainer'),
    onSecondaryContainer: resolve('onSecondaryContainer'),
    tertiary: resolve('tertiary'),
    onTertiary: resolve('onTertiary'),
    tertiaryContainer: resolve('tertiaryContainer'),
    onTertiaryContainer: resolve('onTertiaryContainer'),
    error: resolve('error'),
    onError: resolve('onError'),
    errorContainer: resolve('errorContainer'),
    onErrorContainer: resolve('onErrorContainer'),
    surface: resolve('surface'),
    onSurface: resolve('onSurface'),
    surfaceVariant: resolve('surfaceVariant'),
    onSurfaceVariant: resolve('onSurfaceVariant'),
    surfaceContainerLowest: resolve('surfaceContainerLowest'),
    surfaceContainerLow: resolve('surfaceContainerLow'),
    surfaceContainer: resolve('surfaceContainer'),
    surfaceContainerHigh: resolve('surfaceContainerHigh'),
    surfaceContainerHighest: resolve('surfaceContainerHighest'),
    outline: resolve('outline'),
    outlineVariant: resolve('outlineVariant'),
    inverseSurface: resolve('inverseSurface'),
    inverseOnSurface: resolve('inverseOnSurface'),
    inversePrimary: resolve('inversePrimary'),
    background: resolve('surface'), // M3 uses surface for background
    onBackground: resolve('onSurface'),
    scrim: resolve('scrim'),
    shadow: resolve('shadow'),
  };
}

/**
 * Main transform function
 */
export function transformDTCGToDesignLanguage(
  primitiveColors: DTCGPrimitivesColors,
  semanticLight: Record<string, DTCGColorToken>,
  semanticDark: Record<string, DTCGColorToken>
): Pick<DesignLanguageContract, 'colors' | 'semantic' | 'semanticDark'> {
  return {
    colors: toColorPalettes(primitiveColors),
    semantic: toSemanticColors(semanticLight, primitiveColors),
    semanticDark: toSemanticColors(semanticDark, primitiveColors),
  };
}
```

---

## Part 4: Reverse Transform (Design System → Figma)

### File: `scripts/design-language-to-dtcg.ts`

```typescript
import type { 
  DesignLanguageContract, 
  TonalPalette,
  SemanticColors 
} from '../src/contracts/design-language.contract';

const TONAL_STEPS = [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 95, 99, 100] as const;

/**
 * Transform TonalPalette to DTCG format
 */
function tonalPaletteToDTCG(palette: TonalPalette, paletteName: string) {
  const group: Record<string, any> = {
    $type: 'color'
  };
  
  for (const step of TONAL_STEPS) {
    group[String(step)] = {
      $value: palette[step]
    };
  }
  
  return group;
}

/**
 * Find which primitive a semantic color references
 * Returns alias string like "{primary.40}"
 */
function findPrimitiveAlias(
  hexValue: string,
  colors: DesignLanguageContract['colors']
): string | null {
  const palettes = ['primary', 'secondary', 'tertiary', 'neutral', 'neutralVariant', 'error'] as const;
  
  for (const paletteName of palettes) {
    const palette = colors[paletteName];
    for (const step of TONAL_STEPS) {
      if (palette[step].toLowerCase() === hexValue.toLowerCase()) {
        return `{${paletteName}.${step}}`;
      }
    }
  }
  
  return null; // No matching primitive found
}

/**
 * Transform SemanticColors to DTCG format with aliases
 */
function semanticColorsToDTCG(
  semantic: SemanticColors,
  colors: DesignLanguageContract['colors']
): Record<string, any> {
  const result: Record<string, any> = {};
  
  const semanticKeys: (keyof SemanticColors)[] = [
    'primary', 'onPrimary', 'primaryContainer', 'onPrimaryContainer',
    'secondary', 'onSecondary', 'secondaryContainer', 'onSecondaryContainer',
    'tertiary', 'onTertiary', 'tertiaryContainer', 'onTertiaryContainer',
    'error', 'onError', 'errorContainer', 'onErrorContainer',
    'surface', 'onSurface', 'surfaceVariant', 'onSurfaceVariant',
    'surfaceContainerLowest', 'surfaceContainerLow', 'surfaceContainer',
    'surfaceContainerHigh', 'surfaceContainerHighest',
    'outline', 'outlineVariant',
    'inverseSurface', 'inverseOnSurface', 'inversePrimary',
    'scrim', 'shadow'
  ];
  
  for (const key of semanticKeys) {
    const hexValue = semantic[key];
    const alias = findPrimitiveAlias(hexValue, colors);
    
    result[key] = {
      $type: 'color',
      $value: alias || hexValue // Use alias if found, otherwise raw hex
    };
  }
  
  return result;
}

/**
 * Main reverse transform function
 */
export function transformDesignLanguageToDTCG(
  language: DesignLanguageContract
): {
  primitives: Record<string, any>;
  semanticLight: Record<string, any>;
  semanticDark: Record<string, any>;
} {
  // Transform primitives
  const primitives: Record<string, any> = {};
  const palettes = ['primary', 'secondary', 'tertiary', 'neutral', 'neutralVariant', 'error'] as const;
  
  for (const paletteName of palettes) {
    primitives[paletteName] = tonalPaletteToDTCG(
      language.colors[paletteName], 
      paletteName
    );
  }
  
  // Transform semantics
  const semanticLight = semanticColorsToDTCG(language.semantic, language.colors);
  const semanticDark = language.semanticDark 
    ? semanticColorsToDTCG(language.semanticDark, language.colors)
    : {};
  
  return {
    primitives,
    semanticLight,
    semanticDark
  };
}
```

---

## Part 5: figma-token-sync Plugin Requirements

### Export Function Requirements

1. **Separate collections into separate files**
   - `Primitives/Colors` → `tokens/primitives/colors.json`
   - `Semantic/Colors` → `tokens/semantic/colors.{mode}.json`

2. **Handle Figma modes correctly**
   - Export each mode as a separate file
   - Mode name becomes part of filename

3. **Resolve aliases to DTCG format**
   - Figma: `{Primitives/Colors.primary/40}`
   - DTCG: `{primary.40}`

4. **Validate DTCG compliance**
   - No `$value` at same level as children
   - `$type` can be at group level (inherited)
   - All values must be valid for their type

### Import Function Requirements

1. **Create/update Figma variables from DTCG**
   - Match by variable name path
   - Create new variables if not exists
   - Update values if changed

2. **Resolve DTCG aliases to Figma references**
   - DTCG: `{primary.40}`
   - Figma: `{Primitives/Colors.primary/40}`

3. **Handle multi-mode variables**
   - Parse mode from filename or DTCG extensions
   - Set correct value per mode

---

## Part 6: Validation Checklist

### DTCG Compliance
- [ ] No `$value` property at same level as child tokens
- [ ] All `$type` values are valid DTCG types
- [ ] Aliases use `{path.to.token}` format
- [ ] No circular references in aliases

### Design Language Contract Compliance
- [ ] All 13 tonal steps present for each palette (0-100)
- [ ] All 31 semantic colors present
- [ ] All semantic colors can resolve to primitives

### Figma Structure Compliance
- [ ] Collections match expected names
- [ ] Variables follow naming convention
- [ ] Modes are correctly configured
- [ ] Cross-collection references are valid

---

## Part 7: File Locations

### figma-token-sync Repository
```
figma-token-sync/
├── packages/
│   └── figma-plugin/
│       └── src/
│           ├── export/
│           │   ├── exportVariables.ts      # Main export logic
│           │   ├── resolveAliases.ts       # Alias resolution
│           │   └── validateDTCG.ts         # DTCG validation
│           └── import/
│               ├── importVariables.ts      # Main import logic
│               └── createVariables.ts      # Variable creation
├── test-output/                            # Export test files
└── FIGMA_DESIGN_SYSTEM_SYNC_SPEC.md       # This document
```

### Discourser-Design-System Repository
```
Discourser-Design-System/
├── tokens/                                 # DTCG token files (synced)
│   ├── primitives/
│   │   └── colors.json
│   └── semantic/
│       ├── colors.light.json
│       └── colors.dark.json
├── scripts/
│   ├── dtcg-to-design-language.ts         # Transform DTCG → Contract
│   └── design-language-to-dtcg.ts         # Transform Contract → DTCG
└── src/
    ├── contracts/
    │   └── design-language.contract.ts     # TypeScript interface
    └── languages/
        └── material3.language.ts           # Generated from DTCG
```

---

## Appendix A: M3 Tonal Palette Reference

Material Design 3 tonal palettes are generated algorithmically from a source color using the HCT (Hue, Chroma, Tone) color space.

| Tone | Light Theme Usage | Dark Theme Usage |
|------|-------------------|------------------|
| 0 | - | - |
| 10 | onPrimaryContainer | primary |
| 20 | - | onPrimary |
| 30 | - | primaryContainer |
| 40 | primary | - |
| 50 | - | - |
| 60 | - | - |
| 70 | - | - |
| 80 | inversePrimary | primary |
| 90 | primaryContainer | onPrimaryContainer |
| 95 | - | - |
| 99 | surface | - |
| 100 | onPrimary | - |

---

## Appendix B: Quick Reference Card

### Figma → DTCG Mapping

| Figma | DTCG |
|-------|------|
| Collection name | Root object / filename |
| Variable group `/` | Object nesting `.` |
| Variable name | Token key |
| Variable value | `$value` property |
| Variable type | `$type` property |
| Mode | Separate file or `$extensions` |
| Alias `{Collection.path/to/var}` | `{path.to.var}` |

### DTCG → Contract Mapping

| DTCG Path | Contract Path |
|-----------|---------------|
| `primary.40.$value` | `colors.primary[40]` |
| `semantic.primary.$value` | `semantic.primary` |
| `spacing.md.$value` | `spacing.md` |

---

## Appendix C: Implementation Task List

> **IMPORTANT**: This is the authoritative task list. Follow these phases in order.
> Do NOT skip phases or create alternative tasks.

---

### Phase 1: Fix DTCG Export Compliance ✅ COMPLETE

**Task 1.1: Separate primitives from semantic tokens in export** ✅
- Solution implemented: Two separate export buttons in Figma plugin
- "Export Primitives" → `primitives-colors.json`
- "Export Semantics" → `semantic-colors.json`
- No `$value` at same level as children (DTCG compliant)

**Task 1.2: Validate DTCG output** ✅
- Validation confirms both files are DTCG compliant
- Primitives contain raw hex values
- Semantics contain alias references like `{primary.40}`

**Completed Files:**
- `test-output/primitives-colors.json` - tonal palettes
- `test-output/semantic-colors.json` - semantic aliases

---

### Phase 2: Implement Transform Scripts ✅ COMPLETE

> **Repository**: `Discourser-Design-System`
> **Purpose**: Bridge between DTCG tokens and TypeScript design language contract
> **Completed**: January 9, 2025

**Task 2.1: Create `dtcg-to-design-language.ts`** ✅ COMPLETE
- Location: `Discourser-Design-System/scripts/dtcg-to-design-language.ts`
- Input: DTCG JSON files from `tokens/` directory
  - `tokens/primitives/colors.json`
  - `tokens/semantic/colors.light.json`
  - `tokens/semantic/colors.dark.json`
- Output: Updates `src/languages/material3.language.ts`
- Reference: See **Part 3** of this spec for implementation code

**Task 2.2: Create `design-language-to-dtcg.ts`** ✅ COMPLETE
- Location: `Discourser-Design-System/scripts/design-language-to-dtcg.ts`
- Input: `src/languages/material3.language.ts`
- Output: Single `tokens.json` file for Figma import (see Architecture Decision below)
- Reference: See **Part 4** of this spec for implementation code

**Architecture Decision: Asymmetric Import/Export**
```
EXPORT (Figma → Code): TWO files for DTCG compliance
├── primitives-colors.json  (tonal palettes with raw hex values)
└── semantic-colors.json    (aliases like {primary.40})

IMPORT (Code → Figma): ONE file for better UX
└── tokens.json  (combined file, mirrors Material 3 pattern)
```

---

### Phase 3: Figma Import Function 🔄 CURRENT PHASE

> **Repository**: `figma-token-sync`
> **Depends on**: Phase 2 completion (need `tokens.json` format defined) ✅ COMPLETE

**Task 3.1: Implement single-file import**
- Add "Import Tokens" button to Figma plugin UI
- Accept single `tokens.json` file (output from Task 2.2)
- Plugin internally routes tokens to correct Figma collections:
  - Primitive tokens → `Primitives/Colors` collection
  - Semantic tokens → `Semantic/Colors` collection
- Transform DTCG aliases back to Figma references:
  - DTCG: `{primary.40}`
  - Figma: `{Primitives/Colors.primary/40}`

**Task 3.2: Handle variable creation/update**
- Create variables if they don't exist
- Update values if they do exist
- Handle multi-mode (light/dark) correctly

---

### Phase 4: End-to-End Validation ⬜ NOT STARTED

> **Purpose**: Verify complete round-trip with no data loss

**Task 4.1: Round-trip test**
1. Export from Figma → DTCG (primitives + semantics)
2. Copy to Discourser-Design-System `tokens/` directory
3. Run `dtcg-to-design-language.ts` → updates `material3.language.ts`
4. Make a change in `material3.language.ts`
5. Run `design-language-to-dtcg.ts` → generates `tokens.json`
6. Import `tokens.json` to Figma
7. Verify Figma variables match the code changes
8. Export again and diff with original → verify expected changes only

**Success Criteria:**
- [ ] No data loss in round-trip
- [ ] Changes made in code appear in Figma
- [ ] Changes made in Figma appear in code
- [ ] Alias references remain intact

---

### Progress Summary

| Phase | Status | Tasks | Completed |
|-------|--------|-------|----------|
| Phase 1: Export Compliance | ✅ Complete | 2 | 2/2 |
| Phase 2: Transform Scripts | ✅ Complete | 2 | 2/2 |
| Phase 3: Figma Import | 🔄 Current | 2 | 0/2 |
| Phase 4: Validation | ⬜ Not Started | 1 | 0/1 |
