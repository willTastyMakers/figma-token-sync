#!/usr/bin/env node

import { Command } from 'commander';
import { initCommand } from './commands/init.js';
import { validateCommand } from './commands/validate.js';
import { convertCommand } from './commands/convert.js';
import { diffCommand } from './commands/diff.js';
import { generateTypographyCommand } from './commands/generate-typography.js';

const program = new Command();

program
  .name('figma-token-sync')
  .description('Design token tools for Figma Variables sync (via Plugin)')
  .version('0.1.0');

// Configuration
program.addCommand(initCommand);

// File operations (no Figma connection needed)
program.addCommand(validateCommand);
program.addCommand(convertCommand);
program.addCommand(diffCommand);
program.addCommand(generateTypographyCommand);

// Note: Pull/push operations are handled by the Figma Plugin, not CLI
// The plugin exports/imports tokens.json files directly

program.parse();