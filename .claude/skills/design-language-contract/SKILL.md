# DesignLanguageContract Skill

## Overview

This skill provides knowledge for working with the DesignLanguageContract pattern used in the @discourser/design-system and related projects.

## Architecture

The DesignLanguageContract enables **aesthetic-agnostic** design systems where the visual language (M3, Shadcn, Chakra, custom) can be swapped by changing a single import.

```
Layer 1: Infrastructure (Unchanging)
├── Token pipeline
├── Build system
├── Component logic
└── Type contracts

Layer 2: Design Language (Swappable) ← DesignLanguageContract
├── Token values (colors, spacing, radii)
├── Semantic mappings
└── Motion patterns

Layer 3: Component Recipes (Derived)
├── Visual styling
└── Variant definitions
```

## Contract Interface

```typescript
interface DesignLanguageContract {
  name: string;
  version: string;
  colors: ColorPalettes;
  semantic: SemanticColors;
  semanticDark?: SemanticColors;
  typography: TypographyConfig;
  spacing: SpacingScale;
  shape: ShapeConfig;
  elevation: ElevationConfig;
  motion: MotionConfig;
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

## Typography

```typescript
interface TypographyConfig {
  fonts: {
    display: string;  // e.g., "Georgia, serif"
    body: string;     // e.g., "Inter, sans-serif"
    mono: string;     // e.g., "JetBrains Mono, monospace"
  };
  scale: TypographyScale;
}

interface TypeStyle {
  fontSize: string;
  lineHeight: string;
  fontWeight: string;
  letterSpacing: string;
  fontFamily?: 'display' | 'body' | 'mono';
}

interface TypographyScale {
  displayLarge: TypeStyle;
  displayMedium: TypeStyle;
  displaySmall: TypeStyle;
  headlineLarge: TypeStyle;
  headlineMedium: TypeStyle;
  headlineSmall: TypeStyle;
  titleLarge: TypeStyle;
  titleMedium: TypeStyle;
  titleSmall: TypeStyle;
  bodyLarge: TypeStyle;
  bodyMedium: TypeStyle;
  bodySmall: TypeStyle;
  labelLarge: TypeStyle;
  labelMedium: TypeStyle;
  labelSmall: TypeStyle;
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

## Mapping to DTCG

| Contract Section | DTCG Structure |
|-----------------|----------------|
| `colors.primary.40` | `colors.primary.40.$value` |
| `semantic.primary` | `semantic.primary.$value` |
| `typography.scale.bodyMedium` | Group with nested tokens |
| `spacing.md` | `spacing.md.$value` |
| `shape.radii.medium` | `radii.medium.$value` |
| `elevation.levels.level2` | `elevation.level2.$value` |
| `motion.durations.fast` | `duration.fast.$value` |

## Mapping to Figma Variables

| Contract Section | Figma Collection | Figma Type |
|-----------------|------------------|------------|
| `colors.*` | Primitives | COLOR |
| `semantic.*` | Semantic | COLOR (with aliases) |
| `spacing.*` | Spacing | FLOAT |
| `shape.radii.*` | Radii | FLOAT |
| `typography.*` | — (not in Figma) | — |
| `elevation.*` | — (not in Figma) | — |
| `motion.*` | — (not in Figma) | — |

**Note:** Typography, elevation (shadows), and motion are defined in code only. Figma Variables don't support these token types well.

## Transform Patterns

### Contract → DTCG
```typescript
function languageToTokens(language: DesignLanguageContract): DTCGTokens {
  return {
    colors: transformColorPalettes(language.colors),
    semantic: transformSemanticColors(language.semantic),
    spacing: transformSpacing(language.spacing),
    radii: transformRadii(language.shape.radii),
    // typography, elevation, motion handled separately
  };
}
```

### DTCG → Contract
```typescript
function tokensToLanguage(tokens: DTCGTokens): Partial<DesignLanguageContract> {
  return {
    colors: parseColorPalettes(tokens.colors),
    semantic: parseSemanticColors(tokens.semantic),
    spacing: parseSpacing(tokens.spacing),
    shape: { radii: parseRadii(tokens.radii), style: 'rounded' },
    // typography, elevation, motion preserved from code
  };
}
```

## Reference Implementation

See: `/Users/willstreeter/WebstormProjects/vibe-coding/shifu-project/Discourser-Design-System/src/languages/material3.language.ts`

## Best Practices

1. **Keep code as source of truth** for typography, shadows, motion
2. **Use semantic aliases** — Don't hardcode tonal values in components
3. **Support dark mode** — Include `semanticDark` for theme switching
4. **Version the contract** — Track changes with semver
5. **Validate completeness** — All semantic colors must be defined
