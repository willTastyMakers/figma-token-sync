/**
 * Configuration types for figma-token-sync
 */

export interface FigmaTokenSyncConfig {
  /** Figma file key (from URL: figma.com/file/{fileKey}/...) */
  figmaFileKey: string;

  /** Figma personal access token (can also be set via FIGMA_ACCESS_TOKEN env var) */
  figmaAccessToken?: string;

  /** Local path to token files */
  localPath: string;

  /** Token format to use */
  format: 'dtcg' | 'language-contract' | 'json';

  /** Optional: specific collection IDs to sync */
  collections?: string[];

  /** Optional: mode mappings (Figma mode name -> local mode name) */
  modes?: Record<string, string>;
}