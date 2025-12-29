/**
 * Figma REST API Types
 * @see https://www.figma.com/developers/api#variables
 */

export interface FigmaVariablesResponse {
  status: number;
  error: boolean;
  meta: {
    variables: Record<string, FigmaVariable>;
    variableCollections: Record<string, FigmaVariableCollection>;
  };
}

export interface FigmaVariable {
  id: string;
  name: string;
  key: string;
  variableCollectionId: string;
  resolvedType: 'BOOLEAN' | 'FLOAT' | 'STRING' | 'COLOR';
  valuesByMode: Record<string, FigmaVariableValue>;
  remote: boolean;
  description: string;
  hiddenFromPublishing: boolean;
  scopes: string[];
  codeSyntax: Record<string, string>;
}

export interface FigmaVariableCollection {
  id: string;
  name: string;
  key: string;
  modes: Array<{ modeId: string; name: string }>;
  defaultModeId: string;
  remote: boolean;
  hiddenFromPublishing: boolean;
  variableIds: string[];
}

export type FigmaVariableValue =
  | boolean
  | number
  | string
  | { r: number; g: number; b: number; a: number }
  | { type: 'VARIABLE_ALIAS'; id: string };

export interface FigmaPushResponse {
  success: boolean;
  created: number;
  updated: number;
  deleted: number;
  errors: string[];
}