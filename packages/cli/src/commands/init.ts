import { Command } from 'commander';
import fs from 'fs/promises';
import path from 'path';

export const initCommand = new Command('init')
  .description('Initialize a new figma-token-sync configuration')
  .option('-p, --token-file <path>', 'Path to tokens file', './tokens/tokens.json')
  .option('--format <format>', 'Token format (dtcg|language-contract)', 'dtcg')
  .option('-f, --force', 'Overwrite existing config')
  .action(async (options) => {
    try {
      console.log('Initializing figma-token-sync configuration...');
      console.log('');

      const configPath = './figma-token-sync.config.json';
      const tokenPath = options.tokenFile;

      // Check if config already exists
      try {
        await fs.access(configPath);
        if (!options.force) {
          console.error('✗ Configuration already exists!');
          console.error(`  Found: ${configPath}`);
          console.error('');
          console.error('  Use --force to overwrite');
          process.exit(1);
        }
      } catch {
        // Config doesn't exist, continue
      }

      // Create config file
      const config = {
        version: '1.0.0',
        tokenFile: tokenPath,
        format: options.format,
        plugin: {
          mode: 'default',
          includeAllModes: false,
        },
      };

      await fs.writeFile(configPath, JSON.stringify(config, null, 2), 'utf-8');
      console.log(`✓ Created ${configPath}`);

      // Create tokens directory if needed
      const tokenDir = path.dirname(tokenPath);
      if (tokenDir !== '.') {
        await fs.mkdir(tokenDir, { recursive: true });
        console.log(`✓ Created directory ${tokenDir}/`);
      }

      // Create sample tokens file
      const sampleTokens = {
        colors: {
          $type: 'color',
          primary: {
            $value: '#1976D2',
            $description: 'Primary brand color',
          },
          secondary: {
            $value: '#DC004E',
            $description: 'Secondary brand color',
          },
        },
        spacing: {
          $type: 'dimension',
          small: { $value: '8px' },
          medium: { $value: '16px' },
          large: { $value: '24px' },
        },
      };

      await fs.writeFile(tokenPath, JSON.stringify(sampleTokens, null, 2), 'utf-8');
      console.log(`✓ Created ${tokenPath} (sample tokens)`);
      console.log('');

      console.log('Configuration complete!');
      console.log('');
      console.log('Next steps:');
      console.log('  1. Install "Figma Token Sync" plugin in Figma');
      console.log('  2. Use the plugin to export your Variables → tokens.json');
      console.log('  3. Validate the exported tokens:');
      console.log(`     figma-token-sync validate ${tokenPath}`);
      console.log('  4. Convert between formats if needed:');
      console.log(`     figma-token-sync convert ${tokenPath} output.json --to language-contract`);
      console.log('');

      process.exit(0);
    } catch (error) {
      console.error('✗ Initialization failed:');
      console.error(`  ${error instanceof Error ? error.message : String(error)}`);
      process.exit(1);
    }
  });