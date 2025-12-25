# Node Package Helper (nph)

CLI tool for managing package.json scripts and verifying dependencies.

## Installation

npm install -g node-package-helper

## Usage

nph script          # Display all scripts
nph script add      # Add new script interactively
nph script rm       # Remove scripts interactively
nph script edit     # Edit script interactively
nph dep             # Verify dependencies
nph dep --fix-all   # Fix all dependency issues

## Commands

### Script Management

Display scripts with colored output:
$ nph script

Add a new script:
$ nph script add
Type new script: (e.g myscript)
Command to execute: (e.g node index.js)
Confirm adding myscript: node index.js to package.json ? (y/n)

Remove scripts:
$ nph script rm
Please type which script to remove: (e.g 3 (or 3,4,7 for multiple))

Edit a script:
$ nph script edit
Please type which script to update: (comma separated not accepted for edit)

### Dependency Verification

Verify all dependencies:
$ nph dep

Verify and fix issues:
$ nph dep --fix-all
$ nph dep --fix-version
$ nph dep --fix-name

## Logging

All operations are logged to ./logs/nph.log

## File Permissions

If creating files manually, ensure bin/nph.js is executable:
chmod +x bin/nph.js
