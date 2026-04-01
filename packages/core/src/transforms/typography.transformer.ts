import type { DTCGTokens } from '../types/dtcg.js';
import type { TypographyConfig, WeightVariant } from './language-contract.js';

export interface TextStyleDef {
  name: string;         // e.g. 'Headline/Small/SemiBold'
  fontFamily: string;   // figmaName, e.g. 'Fraunces'
  fontStyle: string;    // Figma style string from weightMap, e.g. 'SemiBold'
  fontSize: number;
  lineHeightPx: number;
  letterSpacing: number;
  tokenPath: string;    // 'typography.scale.{stepName}.weights.{weightName}'
}

function stripPx(value: string): number {
  return parseFloat(value.replace('px', ''));
}

function parseStepName(stepName: string): { category: string; size: string } {
  const match = stepName.match(/^(.+?)(Large|Medium|Small)$/);
  if (!match) throw new Error(`Cannot parse step name: ${stepName}`);
  const prefix = match[1];
  const size = match[2];
  const category = prefix.charAt(0).toUpperCase() + prefix.slice(1);
  return { category, size };
}

/**
 * Produces flat variable tokens for a Typography Figma collection.
 */
export function transformTypographyPrimitives(typography: TypographyConfig): DTCGTokens {
  const Font: Record<string, Record<string, { $type: string; $value: unknown }>> = {
    Size: {},
    LineHeight: {},
    LetterSpacing: {},
    Family: {},
  };

  // Font family alias tokens (display, body, mono)
  for (const [alias, config] of Object.entries(typography.fonts)) {
    Font.Family[alias] = { $type: 'string', $value: config.figmaName };
  }

  // Per-step geometry
  for (const [stepName, step] of Object.entries(typography.scale)) {
    Font.Size[stepName]          = { $type: 'number', $value: stripPx(step.geometry.fontSize) };
    Font.LineHeight[stepName]    = { $type: 'number', $value: stripPx(step.geometry.lineHeight) };
    Font.LetterSpacing[stepName] = { $type: 'number', $value: stripPx(step.geometry.letterSpacing) };
    const fontConfig = typography.fonts[step.geometry.fontFamily as 'display' | 'body' | 'mono'];
    Font.Family[stepName] = { $type: 'string', $value: fontConfig.figmaName };
  }

  return { Font } as DTCGTokens;
}

/**
 * Returns one TextStyleDef per weight variant across all 15 scale steps.
 */
export function buildTextStyleDefs(typography: TypographyConfig): TextStyleDef[] {
  const defs: TextStyleDef[] = [];

  for (const [stepName, step] of Object.entries(typography.scale)) {
    const { category, size } = parseStepName(stepName);
    const fontConfig = typography.fonts[step.geometry.fontFamily as 'display' | 'body' | 'mono'];

    for (const [weightName, variant] of Object.entries(step.weights) as Array<[string, WeightVariant | undefined]>) {
      if (!variant) continue;

      const fontStyle = fontConfig.weightMap[variant.fontWeight as keyof typeof fontConfig.weightMap];
      if (!fontStyle) continue;

      defs.push({
        name: `${category}/${size}/${fontStyle}`,
        fontFamily: fontConfig.figmaName,
        fontStyle,
        fontSize: stripPx(step.geometry.fontSize),
        lineHeightPx: stripPx(step.geometry.lineHeight),
        letterSpacing: stripPx(step.geometry.letterSpacing),
        tokenPath: `typography.scale.${stepName}.weights.${weightName}`,
      });
    }
  }

  return defs;
}
