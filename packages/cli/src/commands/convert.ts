import { Command } from 'commander';
import { loadDTCGFile } from '@figma-token-sync/core/transforms/dtcg-parser';
import { serializeDTCG } from '@figma-token-sync/core/transforms/dtcg-serializer';
import { languageToTokens, tokensToLanguage } from '@figma-token-sync/core/transforms/language-contract';
import type { DTCGTokens } from '@figma-token-sync/core/types/dtcg';
import type { DesignLanguageContract } from '@figma-token-sync/core/transforms/language-contract';
import fs from 'fs/promises';

export const convertCommand = new Command('convert')
  .description('Convert tokens between different formats')
  .argument('<input>', 'Input tokens file')
  .argument('<output>', 'Output file path')
  .option('--from <format>', 'Input format (dtcg|language-contract)', 'dtcg')
  .option('--to <format>', 'Output format (dtcg|language-contract)', 'dtcg')
  .option('--pretty', 'Pretty-print JSON output', true)
  .action(async (input: string, output: string, options) => {
    try {
      console.log(`Converting ${input} from ${options.from} to ${options.to}...`);
      console.log('');

      // Check if conversion is needed
      if (options.from === options.to) {
        console.log('⚠️  Input and output formats are the same. No conversion needed.');
        console.log('   Copying file with formatting...');
      }

      // Load input file
      let tokens: DTCGTokens;

      if (options.from === 'dtcg') {
        tokens = await loadDTCGFile(input);
        console.log('✓ Loaded DTCG tokens');
      } else if (options.from === 'language-contract') {
        const content = await fs.readFile(input, 'utf-8');
        const contract = JSON.parse(content) as DesignLanguageContract;
        tokens = languageToTokens(contract);
        console.log('✓ Loaded DesignLanguageContract and converted to DTCG');
      } else {
        throw new Error(`Unknown input format: ${options.from}`);
      }

      // Convert to output format
      let outputContent: string;

      if (options.to === 'dtcg') {
        outputContent = serializeDTCG(tokens, {
          indent: options.pretty ? 2 : 0,
          sortKeys: false,
          includeExtensions: true,
        });
        console.log('✓ Serialized to DTCG format');
      } else if (options.to === 'language-contract') {
        const contract = tokensToLanguage(tokens);
        outputContent = JSON.stringify(contract, null, options.pretty ? 2 : 0);
        console.log('✓ Converted to DesignLanguageContract format');
      } else {
        throw new Error(`Unknown output format: ${options.to}`);
      }

      // Write output file
      await fs.writeFile(output, outputContent, 'utf-8');
      console.log(`✓ Written to: ${output}`);
      console.log('');
      console.log('Conversion complete!');

      process.exit(0);
    } catch (error) {
      console.error('✗ Conversion failed:');
      console.error(`  ${error instanceof Error ? error.message : String(error)}`);
      process.exit(1);
    }
  });
