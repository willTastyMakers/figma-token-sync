import { Command } from 'commander';
import path from 'path';
import fs from 'fs/promises';
import {
  transformTypographyPrimitives,
  buildTextStyleDefs,
} from '@figma-token-sync/core/transforms/typography.transformer';
import type { DesignLanguageContract } from '@figma-token-sync/core/transforms/language-contract';

export const generateTypographyCommand = new Command('generate-typography')
  .description('Generate typography primitive tokens and text style manifest from a DesignLanguageContract')
  .requiredOption('--language <path>', 'Path to a JS/TS file that default-exports a DesignLanguageContract')
  .requiredOption('--out-dir <dir>', 'Output directory for generated files')
  .action(async (options) => {
    try {
      // 1. Resolve language path to absolute
      const resolvedPath = path.resolve(options.language);

      // 2. Dynamic-import the contract
      const mod = await import(resolvedPath);
      const contract: DesignLanguageContract =
        mod.default ?? mod.material3Language ?? (() => { throw new Error(`No default export found in ${resolvedPath}. Expected a DesignLanguageContract as default or material3Language.`); })();

      // 3. Generate typography primitives
      const primitives = transformTypographyPrimitives(contract.typography);
      const primitivesPath = path.join(options.outDir, 'typography-primitives.json');
      await fs.mkdir(options.outDir, { recursive: true });
      await fs.writeFile(primitivesPath, JSON.stringify(primitives, null, 2), 'utf-8');

      // Count Font/* variables
      const fontGroup = (primitives as any).Font ?? {};
      const variableCount = Object.values(fontGroup).reduce<number>(
        (acc, group) => acc + Object.keys(group as object).length,
        0
      );

      console.log(`✓ typography-primitives.json — ${variableCount} Font/* variables written`);

      // 4. Generate text style manifest
      const textStyleDefs = buildTextStyleDefs(contract.typography);
      const manifestPath = path.join(options.outDir, 'typography-text-styles.manifest.json');
      await fs.writeFile(manifestPath, JSON.stringify(textStyleDefs, null, 2), 'utf-8');

      console.log(`✓ typography-text-styles.manifest.json — ${textStyleDefs.length} text style definitions written`);

      process.exit(0);
    } catch (error) {
      console.error('✗ generate-typography failed:');
      console.error(`  ${error instanceof Error ? error.message : String(error)}`);
      process.exit(1);
    }
  });
