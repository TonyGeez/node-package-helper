const { Command } = require('commander');

const program = new Command();

program
  .name('script')
  .description('Manage package.json scripts');

// Add command
program
  .command('add')
  .description('Add a new script to package.json')
  .action(async () => {
    const NPH = require('../../lib/index.js');
    const nph = new NPH();
    await nph.addScript();
  });

// Remove command
program
  .command('rm')
  .description('Remove scripts from package.json')
  .action(async () => {
    const NPH = require('../../lib/index.js');
    const nph = new NPH();
    await nph.removeScripts();
  });

// Edit command
program
  .command('edit')
  .description('Edit existing scripts in package.json')
  .action(async () => {
    const NPH = require('../../lib/index.js');
    const nph = new NPH();
    await nph.editScript();
  });

module.exports = program;
