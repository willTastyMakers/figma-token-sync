import type { DTCGToken, DTCGTokens } from '../types/dtcg.js';
import { isToken } from './dtcg-parser.js';

/**
 * DesignLanguageContract Interface
 * Based on @discourser/design-system pattern
 */
export interface DesignLanguageContract {
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
  border?: BorderConfig;
}

export interface ColorPalettes {
  primary: TonalPalette;
  secondary: TonalPalette;
  tertiary: TonalPalette;
  neutral: TonalPalette;
  neutralVariant: TonalPalette;
  error: TonalPalette;
}

export interface TonalPalette {
  0: string;
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
  100: string;
}

export interface SemanticColors {
  primary: string;
  onPrimary: string;
  primaryContainer: string;
  onPrimaryContainer: string;
  secondary: string;
  onSecondary: string;
  secondaryContainer: string;
  onSecondaryContainer: string;
  tertiary: string;
  onTertiary: string;
  tertiaryContainer: string;
  onTertiaryContainer: string;
  error: string;
  onError: string;
  errorContainer: string;
  onErrorContainer: string;
  surface: string;
  onSurface: string;
  surfaceVariant: string;
  onSurfaceVariant: string;
  surfaceContainerLowest: string;
  surfaceContainerLow: string;
  surfaceContainer: string;
  surfaceContainerHigh: string;
  surfaceContainerHighest: string;
  outline: string;
  outlineVariant: string;
  inverseSurface: string;
  inverseOnSurface: string;
  inversePrimary: string;
  background: string;
  onBackground: string;
  scrim: string;
  shadow: string;
}

export type WeightName =
  | 'thin' | 'light' | 'regular' | 'medium' | 'semiBold' | 'bold' | 'extraBold';

export interface FontWeightMap {
  '100'?: string;
  '200'?: string;
  '300'?: string;
  '400'?: string;
  '500'?: string;
  '600'?: string;
  '700'?: string;
  '800'?: string;
  '900'?: string;
}

export interface FontConfig {
  family: string;
  figmaName: string;
  weightMap: FontWeightMap;
}

export interface TypeGeometry {
  fontSize: string;
  lineHeight: string;
  letterSpacing: string;
  fontFamily: 'display' | 'body' | 'mono';
  fontVariationSettings?: string;
}

export interface WeightVariant {
  name: WeightName;
  fontWeight: string;
  fontVariationSettings?: string;
}

export interface TypeScaleStep {
  geometry: TypeGeometry;
  defaultWeight: WeightName;
  weights: Partial<Record<WeightName, WeightVariant>>;
}

export interface BorderConfig {
  widths: {
    thin: string;
    medium: string;
    thick: string;
  };
}

export interface TypographyConfig {
  fonts: {
    display: FontConfig;
    body: FontConfig;
    mono: FontConfig;
  };
  scale: TypographyScale;
}

export interface TypeStyle {
  fontSize: string;
  lineHeight: string;
  fontWeight: string;
  letterSpacing: string;
  fontFamily?: 'display' | 'body' | 'mono';
  fontVariationSettings?: string;
}

export interface TypographyScale {
  displayLarge: TypeScaleStep;
  displayMedium: TypeScaleStep;
  displaySmall: TypeScaleStep;
  headlineLarge: TypeScaleStep;
  headlineMedium: TypeScaleStep;
  headlineSmall: TypeScaleStep;
  titleLarge: TypeScaleStep;
  titleMedium: TypeScaleStep;
  titleSmall: TypeScaleStep;
  bodyLarge: TypeScaleStep;
  bodyMedium: TypeScaleStep;
  bodySmall: TypeScaleStep;
  labelLarge: TypeScaleStep;
  labelMedium: TypeScaleStep;
  labelSmall: TypeScaleStep;
}

export interface SpacingScale {
  none: string;
  xxs: string;
  xs: string;
  sm: string;
  md: string;
  lg: string;
  xl: string;
  xxl: string;
  xxxl: string;
}

export interface ShapeConfig {
  radii: RadiiScale;
  style: 'sharp' | 'rounded' | 'soft' | 'organic';
}

export interface RadiiScale {
  none: string;
  extraSmall: string;
  small: string;
  medium: string;
  large: string;
  extraLarge: string;
  full: string;
}

export interface ElevationConfig {
  levels: ElevationScale;
  style: 'shadow' | 'border' | 'blur' | 'flat';
}

export interface ElevationScale {
  level0: string;
  level1: string;
  level2: string;
  level3: string;
  level4: string;
  level5: string;
}

export interface MotionConfig {
  durations: DurationScale;
  easings: EasingScale;
  style: 'expressive' | 'productive' | 'minimal';
}

export interface DurationScale {
  instant: string;
  fast: string;
  normal: string;
  slow: string;
  slower: string;
}

export interface EasingScale {
  standard: string;
  standardDecelerate: string;
  standardAccelerate: string;
  emphasized: string;
  emphasizedDecelerate: string;
  emphasizedAccelerate: string;
}

/**
 * Convert DesignLanguageContract to DTCG tokens
 *
 * Note: Typography, elevation, and motion are kept in code as they're
 * not well-supported by Figma Variables. Only colors, spacing, and radii
 * are converted.
 *
 * @param language - DesignLanguageContract object
 * @returns DTCG token tree
 */
export function languageToTokens(language: DesignLanguageContract): DTCGTokens {
  const tokens: DTCGTokens = {
    colors: transformColorPalettes(language.colors),
    semantic: transformSemanticColors(language.semantic),
    spacing: transformSpacing(language.spacing),
    radii: transformRadii(language.shape.radii),
  };

  // Add dark mode semantic colors if present
  if (language.semanticDark) {
    tokens.semanticDark = transformSemanticColors(language.semanticDark);
  }

  // Add metadata as a special token
  (tokens as any).$extensions = {
    'designLanguageContract': {
      name: language.name,
      version: language.version,
      typographyFonts: {
        display: language.typography.fonts.display.family,
        body: language.typography.fonts.body.family,
        mono: language.typography.fonts.mono.family,
      },
      shapeStyle: language.shape.style,
      elevationStyle: language.elevation.style,
      motionStyle: language.motion.style,
    },
  };

  return tokens;
}

/**
 * Transform color palettes to DTCG format
 */
function transformColorPalettes(palettes: ColorPalettes): DTCGTokens {
  const result: DTCGTokens = {};

  for (const [paletteName, palette] of Object.entries(palettes)) {
    const paletteGroup: any = {
      $type: 'color',
    };

    for (const [tone, value] of Object.entries(palette)) {
      paletteGroup[tone] = { $value: value, $type: 'color' } as DTCGToken;
    }

    result[paletteName] = paletteGroup;
  }

  return result;
}

/**
 * Transform semantic colors to DTCG format
 */
function transformSemanticColors(semantic: SemanticColors): DTCGTokens {
  const result: any = {
    $type: 'color',
  };

  for (const [name, value] of Object.entries(semantic)) {
    result[name] = { $value: value, $type: 'color' } as DTCGToken;
  }

  return result;
}

/**
 * Transform spacing scale to DTCG format
 */
function transformSpacing(spacing: SpacingScale): DTCGTokens {
  const result: any = {
    $type: 'dimension',
  };

  for (const [name, value] of Object.entries(spacing)) {
    result[name] = { $value: value, $type: 'dimension' } as DTCGToken;
  }

  return result;
}

/**
 * Transform radii scale to DTCG format
 */
function transformRadii(radii: RadiiScale): DTCGTokens {
  const result: any = {
    $type: 'dimension',
  };

  for (const [name, value] of Object.entries(radii)) {
    result[name] = { $value: value, $type: 'dimension' } as DTCGToken;
  }

  return result;
}

/**
 * Convert DTCG tokens back to DesignLanguageContract
 *
 * Note: This is a partial reconstruction. Typography, elevation, and motion
 * must be provided separately as they're not in the DTCG tokens.
 *
 * @param tokens - DTCG token tree
 * @param codeOnlyTokens - Typography, elevation, motion from code
 * @returns Partial DesignLanguageContract
 */
export function tokensToLanguage(
  tokens: DTCGTokens,
  codeOnlyTokens?: Partial<DesignLanguageContract>
): Partial<DesignLanguageContract> {
  const result: Partial<DesignLanguageContract> = {};

  // Extract metadata if present
  const metadata = (tokens as any).$extensions?.['designLanguageContract'];
  if (metadata) {
    result.name = metadata.name;
    result.version = metadata.version;
  }

  // Parse colors
  if (tokens.colors) {
    result.colors = parseColorPalettes(tokens.colors as DTCGTokens);
  }

  // Parse semantic colors
  if (tokens.semantic) {
    result.semantic = parseSemanticColors(tokens.semantic as DTCGTokens);
  }

  if (tokens.semanticDark) {
    result.semanticDark = parseSemanticColors(tokens.semanticDark as DTCGTokens);
  }

  // Parse spacing
  if (tokens.spacing) {
    result.spacing = parseSpacing(tokens.spacing as DTCGTokens);
  }

  // Parse radii
  if (tokens.radii) {
    result.shape = {
      radii: parseRadii(tokens.radii as DTCGTokens),
      style: metadata?.shapeStyle || 'rounded',
    };
  }

  // Merge code-only tokens
  if (codeOnlyTokens) {
    Object.assign(result, codeOnlyTokens);
  }

  return result;
}

/**
 * Parse color palettes from DTCG
 */
function parseColorPalettes(tokens: DTCGTokens): ColorPalettes {
  const palettes: Partial<ColorPalettes> = {};

  for (const [paletteName, paletteTokens] of Object.entries(tokens)) {
    if (paletteName.startsWith('$')) continue;

    const palette: Partial<TonalPalette> = {};
    for (const [tone, token] of Object.entries(paletteTokens as DTCGTokens)) {
      if (tone.startsWith('$')) continue;
      if (isToken(token)) {
        (palette as any)[tone] = String(token.$value);
      }
    }

    palettes[paletteName as keyof ColorPalettes] = palette as TonalPalette;
  }

  return palettes as ColorPalettes;
}

/**
 * Parse semantic colors from DTCG
 */
function parseSemanticColors(tokens: DTCGTokens): SemanticColors {
  const semantic: Partial<SemanticColors> = {};

  for (const [name, token] of Object.entries(tokens)) {
    if (name.startsWith('$')) continue;
    if (isToken(token)) {
      semantic[name as keyof SemanticColors] = String(token.$value);
    }
  }

  return semantic as SemanticColors;
}

/**
 * Parse spacing scale from DTCG
 */
function parseSpacing(tokens: DTCGTokens): SpacingScale {
  const spacing: Partial<SpacingScale> = {};

  for (const [name, token] of Object.entries(tokens)) {
    if (name.startsWith('$')) continue;
    if (isToken(token)) {
      spacing[name as keyof SpacingScale] = String(token.$value);
    }
  }

  return spacing as SpacingScale;
}

/**
 * Parse radii scale from DTCG
 */
function parseRadii(tokens: DTCGTokens): RadiiScale {
  const radii: Partial<RadiiScale> = {};

  for (const [name, token] of Object.entries(tokens)) {
    if (name.startsWith('$')) continue;
    if (isToken(token)) {
      radii[name as keyof RadiiScale] = String(token.$value);
    }
  }

  return radii as RadiiScale;
}
