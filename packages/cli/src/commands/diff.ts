import { Command } from 'commander';

export const diffCommand = new Command('diff')
  .description('Show differences between local and Figma variables')
  .option('-c, --config <path>', 'Path to config file')
  .option('--format <format>', 'Output format (text|json)', 'text')
  .action(async (options) => {
    // TODO: Implement diff command
    // - Load config
    // - Fetch remote variables from Figma
    // - Load local token files
    // - Compare and identify differences
    // - Display formatted diff
    console.log('Comparing local and remote...', options);
    throw new Error('Not implemented: diff command');
  });