/**
 * ⚠️ ENTERPRISE-ONLY: Figma Variables REST API Client
 *
 * This file contains a REST API implementation for Figma Variables.
 *
 * **IMPORTANT:** The Figma Variables REST API requires file_variables:read/write scopes,
 * which are ONLY available on Figma Enterprise plans.
 *
 * **This project uses a Figma Plugin approach instead** (works on all plans).
 *
 * This file is kept for reference and potential future Enterprise users.
 * See packages/figma-plugin/ for the actual implementation.
 *
 * @see https://www.figma.com/developers/api#variables
 * @deprecated Use Figma Plugin API instead (packages/figma-plugin/)
 */

import type { FigmaVariablesResponse, FigmaPushResponse } from '../types/figma.js';

const FIGMA_API_BASE = 'https://api.figma.com';
const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY = 1000; // 1 second

/**
 * Custom error class for Figma API errors
 */
export class FigmaAPIError extends Error {
  constructor(
    message: string,
    public status: number,
    public response?: unknown
  ) {
    super(message);
    this.name = 'FigmaAPIError';
  }
}

/**
 * Sleep utility for retry delays
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Exponential backoff retry wrapper
 */
async function withRetry<T>(
  fn: () => Promise<T>,
  retries = MAX_RETRIES
): Promise<T> {
  let lastError: Error | undefined;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      // Don't retry on client errors (except 429 rate limit)
      if (error instanceof FigmaAPIError) {
        if (error.status === 429 && attempt < retries) {
          // Rate limited - use exponential backoff
          const delay = INITIAL_RETRY_DELAY * Math.pow(2, attempt);
          console.warn(`Rate limited. Retrying in ${delay}ms... (attempt ${attempt + 1}/${retries})`);
          await sleep(delay);
          continue;
        }

        // Don't retry on other 4xx errors (auth, not found, etc.)
        if (error.status >= 400 && error.status < 500 && error.status !== 429) {
          throw error;
        }
      }

      // Retry on network errors or 5xx errors
      if (attempt < retries) {
        const delay = INITIAL_RETRY_DELAY * Math.pow(2, attempt);
        console.warn(`Request failed. Retrying in ${delay}ms... (attempt ${attempt + 1}/${retries})`);
        await sleep(delay);
      }
    }
  }

  throw lastError;
}

/**
 * Make a request to the Figma API
 */
async function figmaRequest<T>(
  endpoint: string,
  accessToken: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${FIGMA_API_BASE}${endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers: {
      'X-Figma-Token': accessToken,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  // Handle error responses
  if (!response.ok) {
    const errorText = await response.text();
    let errorMessage = `Figma API error (${response.status})`;

    try {
      const errorJson = JSON.parse(errorText);
      errorMessage = errorJson.message || errorJson.error || errorMessage;
    } catch {
      // Use text as-is if not JSON
      errorMessage = errorText || errorMessage;
    }

    // Provide helpful error messages
    switch (response.status) {
      case 401:
        throw new FigmaAPIError(
          'Invalid or missing Figma access token. Please check your FIGMA_ACCESS_TOKEN.',
          401
        );
      case 403:
        throw new FigmaAPIError(
          'Access denied. You do not have permission to access this Figma file.',
          403
        );
      case 404:
        throw new FigmaAPIError(
          'Figma file not found. Please check the file key.',
          404
        );
      case 429:
        throw new FigmaAPIError(
          'Rate limit exceeded. Please wait before making more requests.',
          429
        );
      default:
        throw new FigmaAPIError(errorMessage, response.status);
    }
  }

  const data = await response.json();
  return data as T;
}

/**
 * Fetch all local variables from a Figma file
 * @see https://www.figma.com/developers/api#get-local-variables-endpoint
 */
export async function fetchFigmaVariables(
  fileKey: string,
  accessToken: string
): Promise<FigmaVariablesResponse> {
  return withRetry(() =>
    figmaRequest<FigmaVariablesResponse>(
      `/v1/files/${fileKey}/variables/local`,
      accessToken
    )
  );
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
  return withRetry(() =>
    figmaRequest<FigmaPushResponse>(
      `/v1/files/${fileKey}/variables`,
      accessToken,
      {
        method: 'POST',
        body: JSON.stringify({ variables }),
      }
    )
  );
}