/**
 * DTCG Token Format (W3C Design Tokens Community Group)
 * @see https://tr.designtokens.org/format/
 */

export interface DTCGToken {
  $type:
    | 'color'
    | 'dimension'
    | 'fontFamily'
    | 'fontWeight'
    | 'duration'
    | 'cubicBezier'
    | 'number'
    | 'string';
  $value: string | number | object;
  $description?: string;
  $extensions?: Record<string, unknown>;
}

export interface DTCGTokens {
  [key: string]: DTCGToken | DTCGTokens;
}