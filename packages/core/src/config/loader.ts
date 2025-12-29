import type { FigmaTokenSyncConfig } from '../types/config.js';

/**
 * Load configuration from figma-token-sync.config.json
 */
export async function loadConfig(configPath?: string): Promise<FigmaTokenSyncConfig> {
  // TODO: Implement config loading
  // - Look for figma-token-sync.config.json in cwd if not specified
  // - Validate required fields
  // - Merge with environment variables (FIGMA_ACCESS_TOKEN)
  throw new Error('Not implemented: loadConfig');
}

/**
 * Initialize a new config file
 */
export async function initConfig(options: Partial<FigmaTokenSyncConfig>): Promise<void> {
  // TODO: Implement config initialization
  // - Create figma-token-sync.config.json
  // - Prompt for required fields if missing
  throw new Error('Not implemented: initConfig');
}