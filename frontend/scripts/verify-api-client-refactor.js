/**
 * API Client Refactoring Verification Script
 * 
 * This script verifies that hardcoded URLs have been replaced with the centralized API client.
 * Run with: npm run verify:api-client
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const FRONTEND_DIR = path.join(__dirname, '..');

function findFiles(dir, extensions = ['.ts', '.tsx'], excludeDirs = ['node_modules', '.git', 'dist', 'build']) {
  const files = [];
  
  function walk(currentPath) {
    try {
      const entries = fs.readdirSync(currentPath, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(currentPath, entry.name);
        
        if (entry.isDirectory()) {
          if (!excludeDirs.includes(entry.name)) {
            walk(fullPath);
          }
        } else if (entry.isFile()) {
          const ext = path.extname(entry.name);
          if (extensions.includes(ext)) {
            files.push(fullPath);
          }
        }
      }
    } catch (err) {
      // Skip directories we can't read
    }
  }
  
  walk(dir);
  return files;
}

function checkFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const relativePath = path.relative(FRONTEND_DIR, filePath);
  
  const issues = [];
  
  // Check for hardcoded localhost:5003 (excluding apiClient.ts, api.ts, and authFix.js)
  if (content.includes('localhost:5003') && 
      !relativePath.includes('apiClient.ts') && 
      !relativePath.includes('api.ts') && 
      !relativePath.includes('authFix.js') &&
      !relativePath.includes('services/')) {
    const lines = content.split('\n');
    lines.forEach((line, index) => {
      if (line.includes('localhost:5003')) {
        issues.push({
          type: 'hardcoded_url',
          line: index + 1,
          content: line.trim(),
        });
      }
    });
  }
  
  // Check if file should use apiClient but doesn't import it
  if ((content.includes('fetch(') || content.includes('axios.')) && 
      content.includes('api/recruiter') &&
      !content.includes('apiClient') &&
      !content.includes('from \'@/utils/apiClient\'') &&
      !relativePath.includes('apiClient.ts') &&
      !relativePath.includes('api.ts')) {
    issues.push({
      type: 'missing_api_client',
      message: 'File makes API calls but does not import apiClient',
    });
  }
  
  return issues;
}

function verifyRefactoring() {
  console.log('🔍 Verifying API client refactoring...\n');
  
  const srcDir = path.join(FRONTEND_DIR, 'src');
  const files = findFiles(srcDir);
  
  const violations = [];
  let checkedFiles = 0;
  
  for (const file of files) {
    const issues = checkFile(file);
    if (issues.length > 0) {
      violations.push({
        file: path.relative(FRONTEND_DIR, file),
        issues,
      });
    }
    checkedFiles++;
  }
  
  console.log(`✅ Checked ${checkedFiles} files\n`);
  
  if (violations.length === 0) {
    console.log('✅ All files are using the centralized API client!\n');
    return true;
  }
  
  console.log(`❌ Found ${violations.length} file(s) with issues:\n`);
  
  violations.forEach(({ file, issues }) => {
    console.log(`📄 ${file}`);
    issues.forEach(issue => {
      if (issue.type === 'hardcoded_url') {
        console.log(`   ⚠️  Line ${issue.line}: Hardcoded URL found`);
        console.log(`      ${issue.content.substring(0, 80)}...`);
      } else if (issue.type === 'missing_api_client') {
        console.log(`   ⚠️  ${issue.message}`);
      }
    });
    console.log('');
  });
  
  return false;
}

// Run verification when script is executed directly
try {
  const success = verifyRefactoring();
  process.exit(success ? 0 : 1);
} catch (error) {
  console.error('Verification failed with error:', error);
  process.exit(1);
}

export { verifyRefactoring };
