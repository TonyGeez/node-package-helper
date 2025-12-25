import { readPackageJson, writePackageJson } from '../package.js';
import { createPrompt } from '../prompts.js';
import { log, logError } from '../logger.js';
import { BAR, HL, HR, POINTER, BOLD, LIGHTCYAN, DIM, RESET, WARNING, SUCCESS, ERROR } from '../colors.js';

export function displayScripts() {
  const { data: packageData } = readPackageJson();
  
  if (!packageData.scripts || Object.keys(packageData.scripts).length === 0) {
    console.log(`${WARNING} No scripts found in package.json${RESET}`);
    process.exit(0);
  }
  
  console.log();
  console.log(`${BAR}`);
  console.log(`${HL} Print Script CLI ${HR}`);
  console.log(`${BAR}`);
  console.log();
  
  const scripts = packageData.scripts;
  const scriptNames = Object.keys(scripts);
  const maxLength = Math.max(...scriptNames.map(name => name.length));
  
  scriptNames.forEach((scriptName) => {
    const paddedName = scriptName.padEnd(maxLength);
    const command = scripts[scriptName];
    console.log(`${POINTER} ${BOLD}${LIGHTCYAN}${paddedName}${RESET} ${DIM}→${RESET} ${LIGHTCYAN}${command}${RESET}`);
  });
  
  console.log();
}

export async function addScript() {
  const { path: packageJsonPath, data: packageData } = readPackageJson();
  const prompt = createPrompt();
  
  try {
    const scriptName = await prompt.question('Type new script', { hint: 'e.g myscript' });
    if (!scriptName) {
      console.log(`${ERROR} Script name cannot be empty${RESET}`);
      process.exit(1);
    }
    
    const command = await prompt.question('Command to execute', { hint: 'e.g node index.js' });
    if (!command) {
      console.log(`${ERROR} Command cannot be empty${RESET}`);
      process.exit(1);
    }
    
    const confirmed = await prompt.confirm(`Confirm adding ${scriptName}: ${command} to package.json ?`);
    
    if (confirmed) {
      if (!packageData.scripts) packageData.scripts = {};
      packageData.scripts[scriptName] = command;
      
      if (writePackageJson(packageJsonPath, packageData)) {
        console.log(`${SUCCESS} Script added successfully${RESET}`);
        log(`Added script: ${scriptName} = ${command}`);
      }
    } else {
      console.log(`${WARNING} Operation cancelled${RESET}`);
    }
  } catch (err) {
    logError(`Error in addScript: ${err.message}`);
    console.log(`${ERROR} An error occurred: ${err.message}${RESET}`);
    process.exit(1);
  } finally {
    prompt.close();
  }
}

export async function removeScripts() {
  const { path: packageJsonPath, data: packageData } = readPackageJson();
  
  if (!packageData.scripts || Object.keys(packageData.scripts).length === 0) {
    console.log(`${WARNING} No scripts found in package.json${RESET}`);
    process.exit(0);
  }
  
  const prompt = createPrompt();
  
  try {
    const scriptNames = Object.keys(packageData.scripts);
    console.log();
    scriptNames.forEach((name, index) => {
      console.log(`${POINTER} ${index + 1}. ${BOLD}${LIGHTCYAN}${name}${RESET} ${DIM}→${RESET} ${LIGHTCYAN}${packageData.scripts[name]}${RESET}`);
    });
    console.log();
    
    const input = await prompt.question('Please type which script to remove', { hint: 'e.g 3 (or 3,4,7 for multiple)' });
    const indices = input.split(',').map(s => parseInt(s.trim()) - 1).filter(i => !isNaN(i));
    
    if (indices.length === 0) {
      console.log(`${ERROR} No valid script numbers provided${RESET}`);
      process.exit(1);
    }
    
    const invalid = indices.filter(i => i < 0 || i >= scriptNames.length);
    if (invalid.length > 0) {
      console.log(`${ERROR} Invalid script numbers: ${invalid.map(i => i + 1).join(', ')}${RESET}`);
      process.exit(1);
    }
    
    const scriptsToRemove = indices.map(i => scriptNames[i]);
    console.log();
    scriptsToRemove.forEach(name => {
      console.log(`${POINTER} ${BOLD}${LIGHTCYAN}${name}${RESET} ${DIM}→${RESET} ${LIGHTCYAN}${packageData.scripts[name]}${RESET}`);
    });
    
    const confirmed = await prompt.confirm(`Confirm removing ${scriptsToRemove.length} script(s)`);
    
    if (confirmed) {
      scriptsToRemove.forEach(name => delete packageData.scripts[name]);
      
      if (writePackageJson(packageJsonPath, packageData)) {
        console.log(`${SUCCESS} Script(s) removed successfully${RESET}`);
        log(`Removed scripts: ${scriptsToRemove.join(', ')}`);
      }
    } else {
      console.log(`${WARNING} Operation cancelled${RESET}`);
    }
  } catch (err) {
    logError(`Error in removeScripts: ${err.message}`);
    console.log(`${ERROR} An error occurred: ${err.message}${RESET}`);
    process.exit(1);
  } finally {
    prompt.close();
  }
}

export async function editScript() {
  const { path: packageJsonPath, data: packageData } = readPackageJson();
  
  if (!packageData.scripts || Object.keys(packageData.scripts).length === 0) {
    console.log(`${WARNING} No scripts found in package.json${RESET}`);
    process.exit(0);
  }
  
  const prompt = createPrompt();
  
  try {
    const scriptNames = Object.keys(packageData.scripts);
    console.log();
    scriptNames.forEach((name, index) => {
      console.log(`${POINTER} ${index + 1}. ${BOLD}${LIGHTCYAN}${name}${RESET} ${DIM}→${RESET} ${LIGHTCYAN}${packageData.scripts[name]}${RESET}`);
    });
    console.log();
    
    const input = await prompt.question('Please type which script to update', { hint: 'comma separated not accepted for edit' });
    const index = parseInt(input.trim()) - 1;
    
    if (isNaN(index) || index < 0 || index >= scriptNames.length) {
      console.log(`${ERROR} Invalid script number${RESET}`);
      process.exit(1);
    }
    
    const oldName = scriptNames[index];
    const oldCommand = packageData.scripts[oldName];
    
    console.log();
    console.log(`${POINTER} Current: ${BOLD}${LIGHTCYAN}${oldName}${RESET} ${DIM}→${RESET} ${LIGHTCYAN}${oldCommand}${RESET}`);
    console.log();
    
    const newName = await prompt.question('New script name', { defaultValue: oldName });
    const newCommand = await prompt.question('New command to execute', { defaultValue: oldCommand });
    
    const confirmed = await prompt.confirm(`Confirm updating to ${newName}: ${newCommand}`);
    
    if (confirmed) {
      if (newName !== oldName) {
        delete packageData.scripts[oldName];
      }
      packageData.scripts[newName] = newCommand;
      
      if (writePackageJson(packageJsonPath, packageData)) {
        console.log(`${SUCCESS} Script updated successfully${RESET}`);
        log(`Updated script: ${oldName} -> ${newName} = ${newCommand}`);
      }
    } else {
      console.log(`${WARNING} Operation cancelled${RESET}`);
    }
  } catch (err) {
    logError(`Error in editScript: ${err.message}`);
    console.log(`${ERROR} An error occurred: ${err.message}${RESET}`);
    process.exit(1);
  } finally {
    prompt.close();
  }
}
