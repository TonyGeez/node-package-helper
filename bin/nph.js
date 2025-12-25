#!/usr/bin/env node

import { Command } from 'commander';
import { displayScripts, addScript, removeScripts, editScript } from '../lib/commands/script.js';
import { depCommand } from '../lib/commands/dep.js';

const program = new Command();

program
  .name('nph')
  .description('Node Package Helper CLI')
  .version('1.0.0');

const scriptCmd = program
  .command('script')
  .description('Display and manage package.json scripts');

scriptCmd
  .command('add')
  .description('Add a new script interactively')
  .action(addScript);

scriptCmd
  .command('rm')
  .description('Remove scripts interactively')
  .action(removeScripts);

scriptCmd
  .command('edit')
  .description('Edit a script interactively')
  .action(editScript);

scriptCmd
  .action(displayScripts);

program
  .command('dep')
  .description('Verify dependencies against npm registry')
  .option('--fix-all', 'Fix all issues automatically')
  .option('--fix-version', 'Fix version issues only')
  .option('--fix-name', 'Fix package name issues only')
  .action(depCommand);

program.parse();
