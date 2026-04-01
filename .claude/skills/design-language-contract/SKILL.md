# DesignLanguageContract Skill

## Overview

This skill provides knowledge for working with the DesignLanguageContract pattern
used in @discourser/design-system and related projects.

The contract enables **aesthetic-agnostic** design systems where the visual language
(M3, Carbon, Fluent, custom) can be swapped by changing a single import.

**Source of truth:**
`/Users/willstreeter/WebstormProjects/vibe-coding/shifu-project/Discourser-Design-System/src/contracts/design-language.contract.ts`
`/Users/willstreeter/WebstormProjects/vibe-coding/shifu-project/Discourser-Design-System/src/languages/material3.language.ts`

---

## Top-Level Interface

```typescript
interface DesignLanguageContract {
  name: string;
  version: string;
  colors: ColorPalettes;
  semantic: SemanticColors;
  semanticDark?: SemanticColors;
  typography: TypographyConfig;  // ← FontConfig objects + TypeScaleStep scale
  spacing: SpacingScale;
  shape: ShapeConfig;
  elevation: ElevationConfig;
  motion: MotionConfig;
  border: BorderConfig;
}
```

## Color Palettes

Tonal palettes with 13 stops (M3 pattern):

```typescript
interface TonalPalette {
  0: string;    // Darkest
  10: string;
  20: string;
  30: string;
  40: string;
  50: string;
  60: string;
  70: string;
  80: string;
  90: string;
  95: string;
  99: string;
  100: string;  // Lightest (white)
}

interface ColorPalettes {
  primary: TonalPalette;
  secondary: TonalPalette;
  tertiary: TonalPalette;
  neutral: TonalPalette;
  neutralVariant: TonalPalette;
  error: TonalPalette;
}
```

## Semantic Colors

Role-based color assignments:

```typescript
interface SemanticColors {
  // Primary
  primary: string;
  onPrimary: string;
  primaryContainer: string;
  onPrimaryContainer: string;
  
  // Secondary
  secondary: string;
  onSecondary: string;
  secondaryContainer: string;
  onSecondaryContainer: string;
  
  // Tertiary
  tertiary: string;
  onTertiary: string;
  tertiaryContainer: string;
  onTertiaryContainer: string;
  
  // Error
  error: string;
  onError: string;
  errorContainer: string;
  onErrorContainer: string;
  
  // Surface (backgrounds)
  surface: string;
  onSurface: string;
  surfaceVariant: string;
  onSurfaceVariant: string;
  surfaceContainerLowest: string;
  surfaceContainerLow: string;
  surfaceContainer: string;
  surfaceContainerHigh: string;
  surfaceContainerHighest: string;
  
  // Outline
  outline: string;
  outlineVariant: string;
  
  // Inverse
  inverseSurface: string;
  inverseOnSurface: string;
  inversePrimary: string;
  
  // Background
  background: string;
  onBackground: string;
  
  // Misc
  scrim: string;
  shadow: string;
}
```

## Typography — Current Shape (Phase 1 complete)

Typography has two layers: **fonts** (per-family config including weight maps)
and **scale** (per-step geometry + weight variants).

### FontConfig

```typescript
interface FontConfig {
  family: string;           // Full CSS font-family string, e.g. '"Fraunces", Georgia, serif'
  figmaName: string;        // Exact family name as Figma knows it, e.g. 'Fraunces'
  weightMap: FontWeightMap; // numeric weight → Figma style string
}

interface FontWeightMap {
  '100'?: string;  // e.g. 'Thin'
  '200'?: string;
  '300'?: string;  // e.g. 'Light'
  '400'?: string;  // e.g. 'Regular'
  '500'?: string;  // e.g. 'Medium'
  '600'?: string;  // e.g. 'SemiBold'
  '700'?: string;  // e.g. 'Bold'
  '800'?: string;
  '900'?: string;
}
```

material3 fonts (actual values):
```typescript
fonts: {
  display: { family: '"Fraunces", Georgia, serif',    figmaName: 'Fraunces',       weightMap: { '100':'Thin','300':'Light','400':'Regular','500':'Medium','600':'SemiBold','700':'Bold' } },
  body:    { family: '"Poppins", -apple-system, ...',  figmaName: 'Poppins',        weightMap: { '100':'Thin','300':'Light','400':'Regular','500':'Medium','600':'SemiBold','700':'Bold' } },
  mono:    { family: '"JetBrains Mono", ...',          figmaName: 'JetBrains Mono', weightMap: { '400':'Regular','700':'Bold' } },
}
```

### TypeScaleStep

Each of the 15 scale steps is a `TypeScaleStep`, not a flat `TypeStyle`.

```typescript
type WeightName = 'thin' | 'light' | 'regular' | 'medium' | 'semiBold' | 'bold' | 'extraBold';

interface TypeGeometry {
  fontSize: string;               // e.g. '24px'
  lineHeight: string;             // e.g. '32px'
  letterSpacing: string;          // e.g. '0px' or '-0.25px'
  fontFamily: 'display' | 'body' | 'mono';
  fontVariationSettings?: string; // Only on displayLarge and headlineMedium
}

interface WeightVariant {
  name: WeightName;
  fontWeight: string;              // '100' | '300' | '400' | '500' | '600' | '700'
  fontVariationSettings?: string;  // per-weight override (rare)
}

interface TypeScaleStep {
  geometry: TypeGeometry;
  defaultWeight: WeightName;       // used by Panda/shim when no weight specified
  weights: Partial<Record<WeightName, WeightVariant>>;
}
```

### Weight matrix per category

| Category | Weights available              | defaultWeight |
|----------|--------------------------------|---------------|
| Display  | regular, semiBold              | regular       |
| Headline | light, regular, semiBold       | regular       |
| Title    | regular, medium, semiBold, bold | medium       |
| Body     | light, regular, medium, semiBold | regular     |
| Label    | light, medium, semiBold, bold  | medium        |

### fontVariationSettings — preserved steps

Only two steps carry `fontVariationSettings` at the geometry level:
- `displayLarge`: `"'SOFT' 0, 'WONK' 1"`
- `headlineMedium`: `"'SOFT' 0, 'WONK' 1"`

### TypeStyle — compatibility shim (unchanged)

`TypeStyle` still exists for Panda CSS recipes and `resolveTypeStyle()`.
It is a flat resolved shape. Never replace it; use it via the shim only.

```typescript
interface TypeStyle {
  fontSize: string;
  lineHeight: string;
  fontWeight: string;
  letterSpacing: string;
  fontFamily?: 'display' | 'body' | 'mono';
  fontVariationSettings?: string;
}

// Shim: collapses a TypeScaleStep + optional WeightName → TypeStyle
function resolveTypeStyle(step: TypeScaleStep, weight?: WeightName): TypeStyle {
  const w = weight ?? step.defaultWeight;
  const variant = step.weights[w] ?? step.weights[step.defaultWeight]!;
  return {
    fontSize: step.geometry.fontSize,
    lineHeight: step.geometry.lineHeight,
    fontWeight: variant.fontWeight,
    letterSpacing: step.geometry.letterSpacing,
    fontFamily: step.geometry.fontFamily,
    fontVariationSettings: variant.fontVariationSettings ?? step.geometry.fontVariationSettings,
  };
}
```

### TypographyConfig

```typescript
interface TypographyConfig {
  fonts: {
    display: FontConfig;
    body: FontConfig;
    mono: FontConfig;
  };
  scale: TypographyScale; // 15 TypeScaleStep entries
}
```

## Spacing

```typescript
interface SpacingScale {
  none: string;   // 0px
  xxs: string;    // 2px
  xs: string;     // 4px
  sm: string;     // 8px
  md: string;     // 16px
  lg: string;     // 24px
  xl: string;     // 32px
  xxl: string;    // 48px
  xxxl: string;   // 64px
}
```

## Shape (Radii)

```typescript
interface ShapeConfig {
  radii: RadiiScale;
  style: 'sharp' | 'rounded' | 'soft' | 'organic';
}

interface RadiiScale {
  none: string;       // 0px
  extraSmall: string; // 4px
  small: string;      // 8px
  medium: string;     // 12px
  large: string;      // 16px
  extraLarge: string; // 28px
  full: string;       // 9999px
}
```

## Elevation (Shadows)

```typescript
interface ElevationConfig {
  levels: ElevationScale;
  style: 'shadow' | 'border' | 'blur' | 'flat';
}

interface ElevationScale {
  level0: string;  // none
  level1: string;  // Subtle
  level2: string;  // Low
  level3: string;  // Medium
  level4: string;  // High
  level5: string;  // Highest
}
```

## Motion

```typescript
interface MotionConfig {
  durations: DurationScale;
  easings: EasingScale;
  style: 'expressive' | 'productive' | 'minimal';
}

interface DurationScale {
  instant: string;  // 0ms
  fast: string;     // 100ms
  normal: string;   // 200ms
  slow: string;     // 300ms
  slower: string;   // 500ms
}

interface EasingScale {
  standard: string;
  standardDecelerate: string;
  standardAccelerate: string;
  emphasized: string;
  emphasizedDecelerate: string;
  emphasizedAccelerate: string;
}
```

---

## Mapping to Figma Variables

| Contract section | Figma Collection | Figma type | Notes |
|---|---|---|---|
| `colors.*` | Primitives | COLOR | Tonal palette hex values |
| `semantic.*` | Semantic | COLOR | Aliases to Primitives |
| `spacing.*` | Spacing & Shape | FLOAT | Strip 'px', raw number |
| `shape.radii.*` | Spacing & Shape | FLOAT | Strip 'px', raw number |
| `typography.fonts.display.figmaName` | Typography | STRING | `'Fraunces'` — no CSS stack |
| `typography.fonts.body.figmaName` | Typography | STRING | `'Poppins'` |
| `typography.fonts.mono.figmaName` | Typography | STRING | `'JetBrains Mono'` |
| `typography.scale.*.geometry.fontSize` | Typography | FLOAT | Strip 'px', raw number |
| `typography.scale.*.geometry.lineHeight` | Typography | FLOAT | Strip 'px', raw number |
| `typography.scale.*.geometry.letterSpacing` | Typography | FLOAT | Strip 'px', raw number |
| `typography.scale.*.geometry.fontFamily` | Typography | — | Resolve alias → figmaName |
| `elevation.*` | — (not in Figma) | — | Code only |
| `motion.*` | — (not in Figma) | — | Code only |

**Note:** Font weights are NOT stored as Figma Variables. They live in the text
style manifest and are applied via `figma.createTextStyle()`.

---

## Typography → Figma: The Two-Step Pattern

Figma cannot receive DTCG composite typography tokens as Variables. Always use
both steps together.

### Step 1 — Flat primitive Variables (Typography collection)

Naming: `Font/{Property}/{scaleName}`

```
Font/Size/displayLarge          → FLOAT  → 57
Font/LineHeight/displayLarge    → FLOAT  → 64
Font/LetterSpacing/displayLarge → FLOAT  → -0.25
Font/Family/displayLarge        → STRING → "Fraunces"
Font/Family/display             → STRING → "Fraunces"  (alias tokens)
Font/Family/body                → STRING → "Poppins"
Font/Family/mono                → STRING → "JetBrains Mono"
```

Font weight is NOT a primitive variable — it belongs only to text styles.

Helper functions always required:

```typescript
// Use figmaName directly — never split the CSS family string
function getFigmaFontName(fontConfig: FontConfig): string {
  return fontConfig.figmaName; // 'Fraunces', 'Poppins', 'JetBrains Mono'
}

// Strip 'px' unit — Figma Variables store raw numbers
function stripPx(value: string): number {
  return parseFloat(value.replace('px', ''));
}
```

Token file output structure:
```json
{
  "Font": {
    "Size":          { "displayLarge": { "$type": "number", "$value": 57 } },
    "LineHeight":    { "displayLarge": { "$type": "number", "$value": 64 } },
    "LetterSpacing": { "displayLarge": { "$type": "number", "$value": -0.25 } },
    "Family": {
      "displayLarge": { "$type": "string", "$value": "Fraunces" },
      "display":      { "$type": "string", "$value": "Fraunces" },
      "body":         { "$type": "string", "$value": "Poppins" },
      "mono":         { "$type": "string", "$value": "JetBrains Mono" }
    }
  }
}
```

### Step 2 — Text Styles with description as semantic bridge

`setBoundVariable` is NOT supported on TextStyle in the Figma Plugin API.
The bridge is the text style **description field**.

Text style naming: `{Category}/{Size}/{WeightLabel}` — slash creates hierarchy.

Description format (always exact):
```
token: typography.scale.{scaleName}.weights.{weightName}
```

Examples:
- Style `Headline/Small/SemiBold` → description: `token: typography.scale.headlineSmall.weights.semiBold`
- Style `Body/Large/Regular`      → description: `token: typography.scale.bodyLarge.weights.regular`

Weight label in style name comes from `fonts.{family}.weightMap`:
- `fontWeight '600'` + Fraunces → `weightMap['600']` = `'SemiBold'`
- `fontWeight '300'` + Poppins  → `weightMap['300']` = `'Light'`

Full 56-style name list: see `tokens/typography-text-styles.manifest.json`
in Discourser-Design-System.

---

## Transform Patterns

### Reading the new typography shape in transform scripts

```typescript
// fonts.display is now FontConfig, not a string
const displayFigmaName = language.typography.fonts.display.figmaName; // 'Fraunces'

// Each scale step has geometry + weights
const step = language.typography.scale.headlineSmall;
const fontSize = parseFloat(step.geometry.fontSize);    // 24
const lineHeight = parseFloat(step.geometry.lineHeight); // 32

// Iterate all weight variants for a step
for (const [weightName, variant] of Object.entries(step.weights)) {
  const fontConfig = language.typography.fonts[step.geometry.fontFamily];
  const figmaStyle = fontConfig.weightMap[variant.fontWeight]; // 'SemiBold'
}

// Resolve defaultWeight for Panda shim
const defaultVariant = step.weights[step.defaultWeight]!;
```

### Contract → DTCG (typography primitives)

```typescript
function transformTypographyPrimitives(typography: TypographyConfig): DTCGTokens {
  const Font: any = { Size: {}, LineHeight: {}, LetterSpacing: {}, Family: {} };

  // Font family alias tokens
  for (const [alias, config] of Object.entries(typography.fonts)) {
    Font.Family[alias] = { $type: 'string', $value: config.figmaName };
  }

  // Per-step geometry
  for (const [stepName, step] of Object.entries(typography.scale)) {
    Font.Size[stepName]          = { $type: 'number', $value: parseFloat(step.geometry.fontSize) };
    Font.LineHeight[stepName]    = { $type: 'number', $value: parseFloat(step.geometry.lineHeight) };
    Font.LetterSpacing[stepName] = { $type: 'number', $value: parseFloat(step.geometry.letterSpacing) };
    const fontConfig = typography.fonts[step.geometry.fontFamily];
    Font.Family[stepName] = { $type: 'string', $value: fontConfig.figmaName };
  }

  return { Font };
}
```

### DTCG → Contract (typography is code-only; no reverse transform needed)

Typography is never imported back from Figma. The source of truth is always
`material3.language.ts`. Figma exports are one-way (DDS → Figma).

---

## Best Practices

1. **Always use `figmaName`**, never split the CSS `family` string
2. **Always use `stripPx()`** before storing geometry values as Figma Variables
3. **Resolve weight label via `weightMap`**, never hardcode 'SemiBold' etc.
4. **`fontVariationSettings` only on displayLarge and headlineMedium** — don't add to others
5. **Typography, elevation, motion are code-only** — never attempt Figma Variable sync for these
6. **Text style description is the semantic bridge** — never omit it
7. **Keep code as source of truth** for typography, shadows, motion
8. **Use semantic aliases** — don't hardcode tonal values in components
9. **Support dark mode** — include `semanticDark` for theme switching
