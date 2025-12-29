import type { FigmaVariablesResponse, FigmaPushResponse } from '../types/figma.js';

/**
 * Fetch all local variables from a Figma file
 * @see https://www.figma.com/developers/api#get-local-variables-endpoint
 */
export async function fetchFigmaVariables(
  fileKey: string,
  accessToken: string
): Promise<FigmaVariablesResponse> {
  // TODO: Implement GET /v1/files/:file_key/variables/local
  // Base URL: https://api.figma.com
  // Header: X-Figma-Token: <accessToken>
  throw new Error('Not implemented: fetchFigmaVariables');
}

/**
 * Push variables to Figma
 * @see https://www.figma.com/developers/api#post-variables-endpoint
 */
export async function pushToFigma(
  fileKey: string,
  accessToken: string,
  variables: unknown[]
): Promise<FigmaPushResponse> {
  // TODO: Implement POST /v1/files/:file_key/variables
  // Base URL: https://api.figma.com
  // Header: X-Figma-Token: <accessToken>
  throw new Error('Not implemented: pushToFigma');
}