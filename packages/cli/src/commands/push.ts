import { Command } from 'commander';

export const pushCommand = new Command('push')
  .description('Push local token files to Figma')
  .option('-c, --config <path>', 'Path to config file')
  .option('--dry-run', 'Show what would be changed without pushing to Figma')
  .action(async (options) => {
    // TODO: Implement push command
    // - Load config
    // - Load local token files
    // - Transform to Figma format
    // - Push to Figma API
    // - Report summary (created, updated, deleted)
    console.log('Pushing to Figma...', options);
    throw new Error('Not implemented: push command');
  });