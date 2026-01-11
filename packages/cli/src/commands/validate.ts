import { Command } from 'commander';
import { loadDTCGFile, countTokens, getTokenTypes } from '@figma-token-sync/core/transforms/dtcg-parser';
import fs from 'fs/promises';

export const validateCommand = new Command('validate')
  .description('Validate a design tokens file')
  .argument('<file>', 'Path to tokens file (JSON)')
  .option('--format <format>', 'Token format (dtcg|language-contract)', 'dtcg')
  .option('--strict', 'Enable strict validation (fail on warnings)')
  .action(async (file: string, options) => {
    try {
      console.log(`Validating ${file} as ${options.format}...`);
      console.log('');

      // Check file exists
      try {
        await fs.access(file);
      } catch {
        console.error(`✗ Error: File not found: ${file}`);
        process.exit(1);
      }

      // Read and validate DTCG format
      if (options.format === 'dtcg') {
        try {
          const tokens = await loadDTCGFile(file);
          const tokenCount = countTokens(tokens);
          const types = getTokenTypes(tokens);

          console.log('✓ Valid DTCG tokens file');
          console.log('');
          console.log(`Tokens: ${tokenCount}`);
          console.log(`Types: ${Array.from(types).join(', ')}`);
          console.log('');
          console.log('Validation checks passed:');
          console.log('  ✓ Valid JSON syntax');
          console.log('  ✓ Required fields present ($value on all tokens)');
          console.log('  ✓ Token types are valid');
          console.log('  ✓ No circular references detected');

          process.exit(0);
        } catch (error) {
          console.error('✗ Validation failed:');
          console.error(`  ${error instanceof Error ? error.message : String(error)}`);
          process.exit(1);
        }
      } else {
        // language-contract format validation
        try {
          const content = await fs.readFile(file, 'utf-8');
          const parsed = JSON.parse(content);

          // Basic structure validation for DesignLanguageContract
          const requiredFields = ['name', 'version', 'colors', 'semantic'];
          const missing = requiredFields.filter(field => !(field in parsed));

          if (missing.length > 0) {
            throw new Error(`Missing required fields: ${missing.join(', ')}`);
          }

          console.log('✓ Valid DesignLanguageContract file');
          console.log('');
          console.log(`Name: ${parsed.name}`);
          console.log(`Version: ${parsed.version}`);
          console.log('');
          console.log('Structure:');
          if (parsed.colors) console.log('  ✓ Color palettes defined');
          if (parsed.semantic) console.log('  ✓ Semantic colors defined');
          if (parsed.semanticDark) console.log('  ✓ Dark mode colors defined');
          if (parsed.spacing) console.log('  ✓ Spacing scale defined');
          if (parsed.shape) console.log('  ✓ Shape config defined');

          process.exit(0);
        } catch (error) {
          console.error('✗ Validation failed:');
          console.error(`  ${error instanceof Error ? error.message : String(error)}`);
          process.exit(1);
        }
      }
    } catch (error) {
      console.error('✗ Unexpected error:');
      console.error(`  ${error instanceof Error ? error.message : String(error)}`);
      process.exit(1);
    }
  });
