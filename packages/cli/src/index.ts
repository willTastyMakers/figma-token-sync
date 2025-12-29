#!/usr/bin/env node

import { Command } from 'commander';
import { initCommand } from './commands/init.js';
import { pullCommand } from './commands/pull.js';
import { pushCommand } from './commands/push.js';
import { diffCommand } from './commands/diff.js';

const program = new Command();

program
  .name('figma-token-sync')
  .description('Bidirectional sync between code tokens and Figma Variables')
  .version('0.1.0');

program.addCommand(initCommand);
program.addCommand(pullCommand);
program.addCommand(pushCommand);
program.addCommand(diffCommand);

program.parse();