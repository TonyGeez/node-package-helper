#!/usr/bin/env node

const { Command } = require('commander');
const NPH = require('../lib/index.js');

const program = new Command();

// Configure the main command
program
  .name('nph')
  .description('Node Package Helper - Manage package.json scripts and dependencies')
  .version('1.0.0');

// Add the script subcommands
program
  .command('script')
  .description('Manage package.json scripts')
  .addCommand(require('./commands/script.js'));

// Add the dependency command
program
  .command('dep')
  .description('Verify dependencies')
  .option('--fix-all', 'Fix all dependency issues')
  .option('--fix-version', 'Fix version issues only')
  .option('--fix-name', 'Fix package name issues only')
  .action((options) => {
    const nph = new NPH();
    nph.verifyDependencies(options).catch(err => {
      console.error(`Error: ${err.message}`);
      process.exit(1);
    });
  });

// Parse command line arguments
program.parse(process.argv);
