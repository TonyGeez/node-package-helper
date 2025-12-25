import https from 'https';
import { execSync } from 'child_process';

export function fetchPackageInfo(packageName) {
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

export function findSimilarPackages(packageName) {
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

export function similarity(s1, s2) {
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

export function findClosestVersion(versions, targetVersion) {
  const cleanTarget = targetVersion.replace(/^[\^~>=<]/, '');
  const versionList = Object.keys(versions).sort((a, b) => {
    const aParts = a.split('.').map(Number);
    const bParts = b.split('.').map(Number);
    for (let i = 0; i < 3; i++) {
      if (aParts[i] !== bParts[i]) return bParts[i] - aParts[i];
    }
    return 0;
  });
  
  if (versionList.includes(cleanTarget)) return cleanTarget;
  
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
