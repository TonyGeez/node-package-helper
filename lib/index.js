const fs = require('fs');
const path = require('path');
const https = require('https');
const { execSync } = require('child_process');
const readline = require('readline');

// Color theme constants
const COLORS = {
  RED: '\x1b[0;31m',
  GREEN: '\x1b[0;32m',
  CYAN: '\x1B[38;5;24m',
  LIGHTCYAN: '\x1B[38;5;152m',
  YELLOW: '\x1b[0;33m',
  BLUE: '\x1B[38;5;31m',
  BGBLUE: '\x1B[48;5;31m',
  BOLD: '\x1B[1m',
  DIM: '\x1B[2m',
  RESET: '\x1B[0m'
};

const ICONS = {
  WARNING: `${COLORS.BOLD}${COLORS.YELLOW}⚠${COLORS.RESET}${COLORS.YELLOW}`,
  ERROR: `${COLORS.BOLD}${COLORS.RED}✘${COLORS.RESET}${COLORS.RED}`,
  SUCCESS: `${COLORS.BOLD}${COLORS.GREEN}✔${COLORS.RESET}${COLORS.GREEN}`,
  HEAD: `${COLORS.BOLD}${COLORS.BLUE}██ `,
  POINTER: `${COLORS.BLUE}█ ${COLORS.RESET}`
};

const DECORATIONS = {
  HL: `${COLORS.BLUE}${COLORS.BGBLUE}█████${COLORS.RESET}${COLORS.BOLD}${COLORS.CYAN}${COLORS.BGBLUE}`,
  HR: `${COLORS.RESET}${COLORS.BLUE}${COLORS.BGBLUE}█████${COLORS.RESET}`,
  BAR: `${COLORS.BLUE}${COLORS.BGBLUE}████████████████████████████${COLORS.RESET}`
};

class NPH {
  constructor() {
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
  }

  close() {
    this.rl.close();
  }

  async question(query) {
    return new Promise((resolve) => {
      this.rl.question(query, (answer) => {
        resolve(answer);
      });
    });
  }

  async questionWithDefault(query, defaultValue) {
    return new Promise((resolve) => {
      this.rl.question(query, (answer) => {
        resolve(answer.trim() || defaultValue);
      });
    });
  }

  // Display package scripts functionality
  displayPackageScripts() {
    const packageJsonPath = path.join(process.cwd(), 'package.json');

    // Check if package.json exists
    if (!fs.existsSync(packageJsonPath)) {
      console.log(`${ICONS.ERROR} No package.json found in current directory${COLORS.RESET}`);
      process.exit(1);
    }

    // Read and parse package.json
    let packageData;
    try {
      const fileContent = fs.readFileSync(packageJsonPath, 'utf8');
      packageData = JSON.parse(fileContent);
    } catch (err) {
      console.log(`${ICONS.ERROR} Failed to read or parse package.json: ${err.message}${COLORS.RESET}`);
      process.exit(1);
    }

    // Check if scripts exist
    if (!packageData.scripts || Object.keys(packageData.scripts).length === 0) {
      console.log(`${ICONS.WARNING} No scripts found in package.json${COLORS.RESET}`);
      process.exit(0);
    }

    // Display header
    console.log();
    console.log(`${DECORATIONS.BAR}`);
    console.log(`${DECORATIONS.HL} Package Scripts ${DECORATIONS.HR}`);
    console.log(`${DECORATIONS.BAR}`);
    console.log();

    // Display scripts
    const scripts = packageData.scripts;
    const scriptNames = Object.keys(scripts);
    const maxLength = Math.max(...scriptNames.map(name => name.length));

    scriptNames.forEach((scriptName, index) => {
      const paddedName = scriptName.padEnd(maxLength);
      const command = scripts[scriptName];
      console.log(`${ICONS.POINTER} ${COLORS.BOLD}${COLORS.LIGHTCYAN}${scriptName}${COLORS.RESET} ${COLORS.DIM}→${COLORS.RESET} ${COLORS.LIGHTCYAN}${command}${COLORS.RESET}`);
    });

    console.log();
  }

  // Add script functionality
  async addScript() {
    try {
      const packageJsonPath = path.join(process.cwd(), 'package.json');

      if (!fs.existsSync(packageJsonPath)) {
        console.log(`${ICONS.ERROR} No package.json found in current directory${COLORS.RESET}`);
        process.exit(1);
      }

      // Read existing package.json
      const packageData = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      
      if (!packageData.scripts) {
        packageData.scripts = {};
      }

      console.log();
      console.log(`${DECORATIONS.BAR}`);
      console.log(`${DECORATIONS.HL} Add New Script ${DECORATIONS.HR}`);
      console.log(`${DECORATIONS.BAR}`);
      console.log();

      // Get script name
      const scriptName = await this.question(`${COLORS.BOLD}Type new script name: ${COLORS.RESET}`);
      
      if (!scriptName.trim()) {
        console.log(`${ICONS.ERROR} Script name cannot be empty${COLORS.RESET}`);
        return;
      }

      if (packageData.scripts[scriptName]) {
        const overwrite = await this.question(`${COLORS.WARNING} Script "${scriptName}" already exists. Overwrite? (y/n): ${COLORS.RESET}`);
        if (overwrite.toLowerCase() !== 'y') {
          console.log(`${ICONS.ERROR} Operation cancelled${COLORS.RESET}`);
          return;
        }
      }

      // Get command
      const command = await this.question(`${COLORS.BOLD}Command to execute: ${COLORS.RESET}`);
      
      if (!command.trim()) {
        console.log(`${ICONS.ERROR} Command cannot be empty${COLORS.RESET}`);
        return;
      }

      // Confirmation
      const confirmation = await this.question(
        `${COLORS.BOLD}Confirm adding "${scriptName}": "${command}" to package.json? (y/n): ${COLORS.RESET}`
      );

      if (confirmation.toLowerCase() !== 'y') {
        console.log(`${ICONS.ERROR} Operation cancelled${COLORS.RESET}`);
        return;
      }

      // Add the script
      packageData.scripts[scriptName] = command;

      // Write back to package.json
      fs.writeFileSync(packageJsonPath, JSON.stringify(packageData, null, 2) + '\n');

      console.log(`${ICONS.SUCCESS} Script "${scriptName}" added successfully!${COLORS.RESET}`);
      console.log();

    } catch (error) {
      console.log(`${ICONS.ERROR} Error adding script: ${error.message}${COLORS.RESET}`);
    } finally {
      this.close();
    }
  }

  // Remove scripts functionality
  async removeScripts() {
    try {
      const packageJsonPath = path.join(process.cwd(), 'package.json');

      if (!fs.existsSync(packageJsonPath)) {
        console.log(`${ICONS.ERROR} No package.json found in current directory${COLORS.RESET}`);
        process.exit(1);
      }

      // Read existing package.json
      const packageData = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      
      if (!packageData.scripts || Object.keys(packageData.scripts).length === 0) {
        console.log(`${ICONS.WARNING} No scripts found in package.json${COLORS.RESET}`);
        return;
      }

      console.log();
      console.log(`${DECORATIONS.BAR}`);
      console.log(`${DECORATIONS.HL} Remove Scripts ${DECORATIONS.HR}`);
      console.log(`${DECORATIONS.BAR}`);
      console.log();

      // Display scripts with numbers
      const scripts = packageData.scripts;
      const scriptNames = Object.keys(scripts);
      const maxLength = Math.max(...scriptNames.map(name => name.length));

      scriptNames.forEach((scriptName, index) => {
        const paddedName = scriptName.padEnd(maxLength);
        const command = scripts[scriptName];
        console.log(`${COLORS.BOLD}${index + 1}.${COLORS.RESET} ${COLORS.LIGHTCYAN}${paddedName}${COLORS.RESET} ${COLORS.DIM}→${COLORS.RESET} ${COLORS.LIGHTCYAN}${command}${COLORS.RESET}`);
      });

      console.log();

      // Get input for removal
      const input = await this.question(
        `${COLORS.BOLD}Please type which script(s) to remove (number, comma-separated acceptable): ${COLORS.RESET}`
      );

      if (!input.trim()) {
        console.log(`${ICONS.ERROR} No script numbers provided${COLORS.RESET}`);
        return;
      }

      // Parse input
      const indices = input.split(',').map(num => parseInt(num.trim()) - 1).filter(num => !isNaN(num));
      
      if (indices.length === 0) {
        console.log(`${ICONS.ERROR} No valid script numbers provided${COLORS.RESET}`);
        return;
      }

      // Validate indices
      const validIndices = indices.filter(index => index >= 0 && index < scriptNames.length);
      
      if (validIndices.length === 0) {
        console.log(`${ICONS.ERROR} No valid script numbers provided${COLORS.RESET}`);
        return;
      }

      // Get scripts to remove
      const scriptsToRemove = validIndices.map(index => scriptNames[index]);
      
      // Confirmation
      const confirmation = await this.question(
        `${COLORS.BOLD}Confirm removing ${scriptsToRemove.length} script(s): ${scriptsToRemove.join(', ')}? (y/n): ${COLORS.RESET}`
      );

      if (confirmation.toLowerCase() !== 'y') {
        console.log(`${ICONS.ERROR} Operation cancelled${COLORS.RESET}`);
        return;
      }

      // Remove scripts
      scriptsToRemove.forEach(scriptName => {
        delete packageData.scripts[scriptName];
      });

      // Write back to package.json
      fs.writeFileSync(packageJsonPath, JSON.stringify(packageData, null, 2) + '\n');

      console.log(`${ICONS.SUCCESS} ${scriptsToRemove.length} script(s) removed successfully!${COLORS.RESET}`);
      console.log();

    } catch (error) {
      console.log(`${ICONS.ERROR} Error removing scripts: ${error.message}${COLORS.RESET}`);
    } finally {
      this.close();
    }
  }

  // Edit script functionality
  async editScript() {
    try {
      const packageJsonPath = path.join(process.cwd(), 'package.json');

      if (!fs.existsSync(packageJsonPath)) {
        console.log(`${ICONS.ERROR} No package.json found in current directory${COLORS.RESET}`);
        process.exit(1);
      }

      // Read existing package.json
      const packageData = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      
      if (!packageData.scripts || Object.keys(packageData.scripts).length === 0) {
        console.log(`${ICONS.WARNING} No scripts found in package.json${COLORS.RESET}`);
        return;
      }

      console.log();
      console.log(`${DECORATIONS.BAR}`);
      console.log(`${DECORATIONS.HL} Edit Script ${DECORATIONS.HR}`);
      console.log(`${DECORATIONS.BAR}`);
      console.log();

      // Display scripts with numbers
      const scripts = packageData.scripts;
      const scriptNames = Object.keys(scripts);
      const maxLength = Math.max(...scriptNames.map(name => name.length));

      scriptNames.forEach((scriptName, index) => {
        const paddedName = scriptName.padEnd(maxLength);
        const command = scripts[scriptName];
        console.log(`${COLORS.BOLD}${index + 1}.${COLORS.RESET} ${COLORS.LIGHTCYAN}${paddedName}${COLORS.RESET} ${COLORS.DIM}→${COLORS.RESET} ${COLORS.LIGHTCYAN}${command}${COLORS.RESET}`);
      });

      console.log();

      // Get input for editing
      const input = await this.question(
        `${COLORS.BOLD}Please type which script to edit (number only): ${COLORS.RESET}`
      );

      if (!input.trim()) {
        console.log(`${ICONS.ERROR} No script number provided${COLORS.RESET}`);
        return;
      }

      // Parse input
      const index = parseInt(input.trim()) - 1;
      
      if (isNaN(index) || index < 0 || index >= scriptNames.length) {
        console.log(`${ICONS.ERROR} Invalid script number provided${COLORS.RESET}`);
        return;
      }

      const scriptName = scriptNames[index];
      const currentCommand = scripts[scriptName];

      console.log(`${COLORS.BOLD}Editing script: ${scriptName}${COLORS.RESET}`);
      console.log(`${COLORS.BOLD}Current command: ${currentCommand}${COLORS.RESET}`);
      console.log();

      // Get new script name
      const newScriptName = await this.questionWithDefault(
        `${COLORS.BOLD}New script name (leave empty to keep "${scriptName}"): ${COLORS.RESET}`,
        scriptName
      );

      // Get new command
      const newCommand = await this.questionWithDefault(
        `${COLORS.BOLD}New command (leave empty to keep "${currentCommand}"): ${COLORS.RESET}`,
        currentCommand
      );

      // Confirmation
      const confirmation = await this.question(
        `${COLORS.BOLD}Confirm updating "${scriptName}" to "${newScriptName}": "${newCommand}"? (y/n): ${COLORS.RESET}`
      );

      if (confirmation.toLowerCase() !== 'y') {
        console.log(`${ICONS.ERROR} Operation cancelled${COLORS.RESET}`);
        return;
      }

      // Update script
      if (newScriptName !== scriptName) {
        delete packageData.scripts[scriptName];
      }
      packageData.scripts[newScriptName] = newCommand;

      // Write back to package.json
      fs.writeFileSync(packageJsonPath, JSON.stringify(packageData, null, 2) + '\n');

      console.log(`${ICONS.SUCCESS} Script updated successfully!${COLORS.RESET}`);
      console.log();

    } catch (error) {
      console.log(`${ICONS.ERROR} Error editing script: ${error.message}${COLORS.RESET}`);
    } finally {
      this.close();
    }
  }

  // Dependency verification functionality
  async verifyDependencies(options = {}) {
    const { fixAll = false, fixVersion = false, fixName = false } = options;

    console.log(`${ICONS.HEAD} NPM Dependency Verifier ${COLORS.RESET}\n`);

    // Read package.json
    const packageJsonPath = path.join(process.cwd(), 'package.json');

    if (!fs.existsSync(packageJsonPath)) {
      console.log(`${ICONS.ERROR} package.json not found in current directory${COLORS.RESET}`);
      process.exit(1);
    }

    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };

    if (Object.keys(dependencies).length === 0) {
      console.log(`${ICONS.WARNING} No dependencies found in package.json${COLORS.RESET}`);
      process.exit(0);
    }

    console.log(`${ICONS.POINTER} Checking ${Object.keys(dependencies).length} dependencies...\n${COLORS.RESET}`);

    const results = [];
    const fixes = {
      dependencies: {},
      devDependencies: {}
    };

    for (const [packageName, version] of Object.entries(dependencies)) {
      const isDev = packageJson.devDependencies && packageJson.devDependencies[packageName];
      const depType = isDev ? 'devDependencies' : 'dependencies';

      process.stdout.write(`${COLORS.DIM}Checking ${packageName}@${version}...${COLORS.RESET}\r`);

      try {
        const packageInfo = await this.fetchPackageInfo(packageName);

        if (!packageInfo) {
          // Package doesn't exist
          const similar = this.findSimilarPackages(packageName);
          const suggestion = similar.length > 0 ? similar[0] : null;

          results.push({
            package: packageName,
            version: version,
            status: 'package-not-found',
            suggestion: suggestion,
            depType: depType
          });

          if ((fixAll || fixName) && suggestion) {
            fixes[depType][suggestion] = version;
          } else {
            fixes[depType][packageName] = version;
          }
        } else {
          // Package exists, check version
          const cleanVersion = version.replace(/^[\^~>=<]/, '');
          const versions = packageInfo.versions;

          if (versions[cleanVersion]) {
            // Version exists
            results.push({
              package: packageName,
              version: version,
              status: 'ok',
              depType: depType
            });
            fixes[depType][packageName] = version;
          } else {
            // Version doesn't exist
            const closestVersion = this.findClosestVersion(versions, version);
            const prefix = version.match(/^[\^~]/)?.[0] || '';

            results.push({
              package: packageName,
              version: version,
              status: 'version-not-found',
              closestVersion: prefix + closestVersion,
              depType: depType
            });

            if (fixAll || fixVersion) {
              fixes[depType][packageName] = prefix + closestVersion;
            } else {
              fixes[depType][packageName] = version;
            }
          }
        }
      } catch (error) {
        results.push({
          package: packageName,
          version: version,
          status: 'error',
          error: error.message,
          depType: depType
        });
        fixes[depType][packageName] = version;
      }
    }

    console.log(' '.repeat(80) + '\r');

    // Display results
    console.log(`${ICONS.HEAD} Verification Results ${COLORS.RESET}\n`);

    let hasErrors = false;

    for (const result of results) {
      if (result.status === 'ok') {
        console.log(`${ICONS.SUCCESS} ${result.package}@${result.version}${COLORS.RESET}`);
      } else if (result.status === 'version-not-found') {
        hasErrors = true;
        console.log(`${ICONS.ERROR} ${result.package}@${result.version}${COLORS.RESET}`);
        console.log(`  ${ICONS.POINTER} Version ${result.version} does not exist for ${result.package}${COLORS.RESET}`);
        console.log(`  ${ICONS.POINTER} Closest version available: ${COLORS.BLUE}${result.closestVersion}${COLORS.RESET}\n`);
      } else if (result.status === 'package-not-found') {
        hasErrors = true;
        console.log(`${ICONS.ERROR} ${result.package}@${result.version}${COLORS.RESET}`);
        console.log(`  ${ICONS.POINTER} This package does not exist${COLORS.RESET}`);
        if (result.suggestion) {
          console.log(`  ${ICONS.POINTER} Did you mean: ${COLORS.BLUE}${result.suggestion}${COLORS.RESET}\n`);
        } else {
          console.log(`  ${ICONS.POINTER} No similar packages found${COLORS.RESET}\n`);
        }
      } else if (result.status === 'error') {
        hasErrors = true;
        console.log(`${ICONS.WARNING} ${result.package}@${result.version} - Error: ${result.error}${COLORS.RESET}`);
      }
    }

    // Apply fixes if requested
    if ((fixAll || fixVersion || fixName) && hasErrors) {
      console.log(`\n${ICONS.HEAD} Applying Fixes ${COLORS.RESET}\n`);

      const newPackageJson = { ...packageJson };
      newPackageJson.dependencies = fixes.dependencies;
      newPackageJson.devDependencies = fixes.devDependencies;

      // Clean up empty objects
      if (Object.keys(newPackageJson.dependencies).length === 0) {
        delete newPackageJson.dependencies;
      }
      if (Object.keys(newPackageJson.devDependencies).length === 0) {
        delete newPackageJson.devDependencies;
      }

      fs.writeFileSync(packageJsonPath, JSON.stringify(newPackageJson, null, 2) + '\n');
      console.log(`${ICONS.SUCCESS} package.json has been updated${COLORS.RESET}`);
    } else if (!hasErrors) {
      console.log(`\n${ICONS.SUCCESS} All dependencies are valid!${COLORS.RESET}`);
    } else {
      console.log(`\n${ICONS.POINTER} Run with ${COLORS.BLUE}--fix-all${COLORS.RESET} to fix all issues`);
      console.log(`${ICONS.POINTER} Run with ${COLORS.BLUE}--fix-version${COLORS.RESET} to fix version issues only`);
      console.log(`${ICONS.POINTER} Run with ${COLORS.BLUE}--fix-name${COLORS.RESET} to fix package name issues only${COLORS.RESET}`);
    }
  }

  // Helper function to fetch package info from npm registry
  fetchPackageInfo(packageName) {
    return new Promise((resolve, reject) => {
      const url = `https://registry.npmjs.org/${encodeURIComponent(packageName)}`;

      https.get(url, (res) => {
        let data = '';

        res.on('data', (chunk) => {
          data += chunk;
        });

        res.on('end', () => {
          if (res.statusCode === 200) {
            try {
              resolve(JSON.parse(data));
            } catch (e) {
              reject(new Error('Failed to parse package data'));
            }
          } else if (res.statusCode === 404) {
            resolve(null);
          } else {
            reject(new Error(`HTTP ${res.statusCode}`));
          }
        });
      }).on('error', (err) => {
        reject(err);
      });
    });
  }

  // Helper function to find similar package names
  findSimilarPackages(packageName) {
    try {
      const result = execSync(`npm search ${packageName} --json --no-description`, {
        encoding: 'utf8',
        stdio: ['pipe', 'pipe', 'ignore'],
        timeout: 5000
      });
      const packages = JSON.parse(result);
      return packages.slice(0, 3).map(p => p.name);
    } catch (e) {
      return [];
    }
  }

  // Helper function to calculate string similarity (Levenshtein distance)
  similarity(s1, s2) {
    const longer = s1.length > s2.length ? s1 : s2;
    const shorter = s1.length > s2.length ? s2 : s1;

    if (longer.length === 0) return 1.0;

    const costs = [];
    for (let i = 0; i <= shorter.length; i++) {
      let lastValue = i;
      for (let j = 0; j <= longer.length; j++) {
        if (i === 0) {
          costs[j] = j;
        } else if (j > 0) {
          let newValue = costs[j - 1];
          if (shorter.charAt(i - 1) !== longer.charAt(j - 1)) {
            newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
          }
          costs[j - 1] = lastValue;
          lastValue = newValue;
        }
      }
      if (i > 0) costs[shorter.length] = lastValue;
    }

    return (longer.length - costs[shorter.length]) / longer.length;
  }

  // Helper function to find closest version
  findClosestVersion(versions, targetVersion) {
    const cleanTarget = targetVersion.replace(/^[\^~>=<]/, '');
    const versionList = Object.keys(versions).sort((a, b) => {
      const aParts = a.split('.').map(Number);
      const bParts = b.split('.').map(Number);
      for (let i = 0; i < 3; i++) {
        if (aParts[i] !== bParts[i]) return bParts[i] - aParts[i];
      }
      return 0;
    });

    // Check if exact version exists
    if (versionList.includes(cleanTarget)) return cleanTarget;

    // Find closest version
    const targetParts = cleanTarget.split('.').map(Number);
    let closest = versionList[0];
    let minDiff = Infinity;

    for (const version of versionList) {
      const parts = version.split('.').map(Number);
      let diff = 0;
      for (let i = 0; i < 3; i++) {
        diff += Math.abs((targetParts[i] || 0) - (parts[i] || 0)) * Math.pow(1000, 2 - i);
      }
      if (diff < minDiff) {
        minDiff = diff;
        closest = version;
      }
    }

    return closest;
  }
}

module.exports = NPH;
