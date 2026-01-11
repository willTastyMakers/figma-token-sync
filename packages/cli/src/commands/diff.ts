import { Command } from 'commander';
import { loadDTCGFile } from '@figma-token-sync/core/transforms/dtcg-parser';
import { compareTokens, formatDiffText, formatDiffJSON } from '@figma-token-sync/core/diff/compare-tokens';

export const diffCommand = new Command('diff')
  .description('Compare two token files and show differences')
  .argument('<file1>', 'First tokens file')
  .argument('[file2]', 'Second tokens file (optional, defaults to file1.backup.json)')
  .option('--format <format>', 'Output format (text|json)', 'text')
  .option('--no-color', 'Disable colored output')
  .action(async (file1: string, file2: string | undefined, options) => {
    try {
      const compareFile = file2 || `${file1}.backup.json`;

      console.log(`Comparing ${file1} with ${compareFile}...`);
      console.log('');

      // Load both token files
      const oldTokens = await loadDTCGFile(compareFile);
      const newTokens = await loadDTCGFile(file1);

      // Compare tokens
      const diff = compareTokens(oldTokens, newTokens);

      // Format and display diff
      if (options.format === 'json') {
        console.log(formatDiffJSON(diff));
      } else {
        console.log(formatDiffText(diff, options.color !== false));
      }

      // Exit with code 1 if there are changes (useful for CI)
      if (diff.summary.totalChanges > 0) {
        process.exit(1);
      } else {
        process.exit(0);
      }
    } catch (error) {
      console.error('✗ Diff failed:');
      console.error(`  ${error instanceof Error ? error.message : String(error)}`);
      process.exit(1);
    }
  });