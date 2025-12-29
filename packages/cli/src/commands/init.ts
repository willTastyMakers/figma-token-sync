import { Command } from 'commander';

export const initCommand = new Command('init')
  .description('Initialize a new figma-token-sync configuration')
  .option('-f, --file-key <key>', 'Figma file key')
  .option('-p, --path <path>', 'Local path for tokens', './tokens')
  .option('--format <format>', 'Token format (dtcg|language-contract|json)', 'dtcg')
  .action(async (options) => {
    // TODO: Implement init command
    // - Prompt for required fields (figmaFileKey)
    // - Create figma-token-sync.config.json
    // - Guide user to create Figma access token
    console.log('Initializing configuration...', options);
    throw new Error('Not implemented: init command');
  });