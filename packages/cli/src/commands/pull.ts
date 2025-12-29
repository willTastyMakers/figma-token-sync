import { Command } from 'commander';

export const pullCommand = new Command('pull')
  .description('Pull variables from Figma to local files')
  .option('-c, --config <path>', 'Path to config file')
  .option('--dry-run', 'Show what would be changed without writing files')
  .action(async (options) => {
    // TODO: Implement pull command
    // - Load config
    // - Fetch variables from Figma
    // - Transform to local format
    // - Write to local files
    // - Report summary (created, updated, deleted)
    console.log('Pulling from Figma...', options);
    throw new Error('Not implemented: pull command');
  });