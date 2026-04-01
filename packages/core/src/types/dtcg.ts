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

// A $value object where keys are mode names and value is the raw token value
export interface DTCGModeValue {
  [modeName: string]: string | number;
}

// Extended token that supports mode-keyed $value
export interface DTCGMultiModeToken {
  $type: DTCGToken['$type'];
  $value: DTCGModeValue;
  $description?: string;
  $extensions?: Record<string, unknown>;
}

// A token that is either standard DTCG or multi-mode
export type AnyDTCGToken = DTCGToken | DTCGMultiModeToken;

// Type guard
export function isMultiModeToken(token: unknown): token is DTCGMultiModeToken {
  return (
    typeof token === 'object' &&
    token !== null &&
    '$value' in token &&
    typeof (token as Record<string, unknown>).$value === 'object' &&
    !Array.isArray((token as Record<string, unknown>).$value)
  );
}

// The top-level figma-variables.json structure: collection name -> token tree
export interface DTCGCollectionFile {
  $metadata?: { version?: string; generated?: string };
  [collectionName: string]: DTCGTokens | DTCGMultiModeToken | { version?: string; generated?: string } | undefined;
}