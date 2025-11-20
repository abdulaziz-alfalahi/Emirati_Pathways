#!/usr/bin/env node

/**
 * Comprehensive Verification Script for API Client Refactoring
 * 
 * This script verifies:
 * 1. No hardcoded URLs remain
 * 2. API client exists and is properly configured
 * 3. Files are using the API client
 * 4. Environment variables are set up
 * 
 * Usage: node scripts/verify-api-client-refactor.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Configuration
const SRC_DIR = path.join(__dirname, '..', 'src');
const EXCLUDED_PATTERNS = [
  /node_modules/,
  /\.test\./,
  /\.spec\./,
  /test/,
  /\.d\.ts$/,
  /apiClient\.ts$/, // The API client itself
  /verify-api-client-refactor\.js$/, // This script
];

const HARCODED_URL_PATTERNS = [
  /http:\/\/localhost:5003/gi,
  /https:\/\/localhost:5003/gi,
  /'http:\/\/localhost:5003/gi,
  /"http:\/\/localhost:5003/gi,
  /`http:\/\/localhost:5003/gi,
];

const ALLOWED_CONTEXTS = [
  /\/\/.*default.*localhost:5003/gi,
  /\/\/.*fallback.*localhost:5003/gi,
  /\.env\./gi,
  /apiClient\.ts/gi,
];

// Results tracking
const results = {
  hardcodedUrls: [],
  apiClientUsage: [],
  missingApiClient: [],
  envConfig: { exists: false, hasApiBaseUrl: false },
  totalFiles: 0,
  filesUsingApiClient: 0,
};

// Get all files recursively
function getAllFiles(dir, fileList = []) {
  try {
    const files = fs.readdirSync(dir);
    
    files.forEach((file) => {
      const filePath = path.join(dir, file);
      
      // Skip excluded patterns
      if (EXCLUDED_PATTERNS.some(pattern => pattern.test(filePath))) {
        return;
      }
      
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory()) {
        getAllFiles(filePath, fileList);
      } else {
        const ext = path.extname(file);
        if (['.ts', '.tsx', '.js', '.jsx'].includes(ext)) {
          fileList.push(filePath);
          results.totalFiles++;
        }
      }
    });
  } catch (error) {
    // Directory might not exist
  }
  
  return fileList;
}

// Check file for hardcoded URLs
function checkFileForHardcodedUrls(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');
    const violations = [];
    
    lines.forEach((line, index) => {
      const hasHardcodedUrl = HARCODED_URL_PATTERNS.some(pattern => pattern.test(line));
      
      if (hasHardcodedUrl) {
        const isAllowed = ALLOWED_CONTEXTS.some(pattern => 
          pattern.test(filePath) || pattern.test(line)
        );
        
        if (!isAllowed) {
          violations.push({
            line: index + 1,
            content: line.trim(),
          });
        }
      }
    });
    
    return violations;
  } catch (error) {
    return [];
  }
}

// Check if file uses API client
function checkApiClientUsage(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const usesApiClient = /from ['"]@\/utils\/apiClient['"]/gi.test(content) ||
                         /from ['"]\.\.\/\.\.\/utils\/apiClient['"]/gi.test(content) ||
                         /import.*apiClient/gi.test(content);
    
    return usesApiClient;
  } catch {
    return false;
  }
}

// Check if file should use API client (recruiter-related files)
function shouldUseApiClient(filePath) {
  const recruiterPatterns = [
    /recruiter/gi,
    /pages\/recruiter/gi,
    /components\/recruiter/gi,
  ];
  
  return recruiterPatterns.some(pattern => pattern.test(filePath));
}

// Check environment configuration
function checkEnvConfig() {
  const envExamplePath = path.join(__dirname, '..', '.env.example');
  const envTemplatePath = path.join(__dirname, '..', '.env.template');
  
  results.envConfig.exists = fs.existsSync(envExamplePath) || fs.existsSync(envTemplatePath);
  
  if (results.envConfig.exists) {
    try {
      const envContent = fs.existsSync(envExamplePath) 
        ? fs.readFileSync(envExamplePath, 'utf-8')
        : fs.readFileSync(envTemplatePath, 'utf-8');
      
      results.envConfig.hasApiBaseUrl = /VITE_API_BASE_URL/gi.test(envContent);
    } catch {
      // Could not read file
    }
  }
}

// Check if API client file exists
function checkApiClientExists() {
  const apiClientPath = path.join(__dirname, '..', 'src', 'utils', 'apiClient.ts');
  return fs.existsSync(apiClientPath);
}

// Main verification function
function verifyRefactoring() {
  log('\n🔍 Starting API Client Refactoring Verification...\n', 'cyan');
  
  // Check if API client exists
  const apiClientExists = checkApiClientExists();
  if (!apiClientExists) {
    log('❌ API Client file not found at src/utils/apiClient.ts', 'red');
    log('   Please create the API client first.\n', 'yellow');
    return false;
  } else {
    log('✅ API Client file exists', 'green');
  }
  
  // Check environment configuration
  checkEnvConfig();
  if (results.envConfig.exists) {
    log('✅ Environment configuration files exist', 'green');
    if (results.envConfig.hasApiBaseUrl) {
      log('✅ VITE_API_BASE_URL is documented', 'green');
    } else {
      log('⚠️  VITE_API_BASE_URL not found in .env.example', 'yellow');
    }
  } else {
    log('⚠️  .env.example or .env.template not found', 'yellow');
  }
  
  // Scan source files
  log('\n📁 Scanning source files...', 'cyan');
  const files = getAllFiles(SRC_DIR);
  
  log(`   Found ${files.length} files to check\n`, 'blue');
  
  // Check each file
  files.forEach((file) => {
    const relativePath = path.relative(path.join(__dirname, '..'), file);
    
    // Check for hardcoded URLs
    const violations = checkFileForHardcodedUrls(file);
    if (violations.length > 0) {
      results.hardcodedUrls.push({
        file: relativePath,
        violations,
      });
    }
    
    // Check API client usage
    const usesApiClient = checkApiClientUsage(file);
    if (usesApiClient) {
      results.filesUsingApiClient++;
      results.apiClientUsage.push(relativePath);
    }
    
    // Check if file should use API client but doesn't
    if (shouldUseApiClient(file) && !usesApiClient) {
      // Check if it has hardcoded URLs
      if (violations.length > 0) {
        results.missingApiClient.push(relativePath);
      }
    }
  });
  
  // Print results
  log('\n📊 Verification Results:\n', 'cyan');
  
  // Hardcoded URLs
  if (results.hardcodedUrls.length === 0) {
    log('✅ No hardcoded URLs found!', 'green');
  } else {
    log(`❌ Found ${results.hardcodedUrls.length} files with hardcoded URLs:`, 'red');
    results.hardcodedUrls.forEach(({ file, violations }) => {
      log(`   ${file}`, 'red');
      violations.forEach(({ line, content }) => {
        log(`      Line ${line}: ${content.substring(0, 80)}...`, 'yellow');
      });
    });
  }
  
  // API Client Usage
  log(`\n📈 API Client Usage:`, 'cyan');
  log(`   Files using API client: ${results.filesUsingApiClient}`, 'blue');
  log(`   Total files checked: ${results.totalFiles}`, 'blue');
  
  if (results.missingApiClient.length > 0) {
    log(`\n⚠️  ${results.missingApiClient.length} recruiter files should use API client:`, 'yellow');
    results.missingApiClient.forEach(file => {
      log(`   ${file}`, 'yellow');
    });
  }
  
  // Summary
  log('\n' + '='.repeat(60), 'cyan');
  const allPassed = results.hardcodedUrls.length === 0;
  
  if (allPassed) {
    log('✅ VERIFICATION PASSED', 'green');
    log('   All hardcoded URLs have been replaced!', 'green');
  } else {
    log('❌ VERIFICATION FAILED', 'red');
    log(`   ${results.hardcodedUrls.length} files still contain hardcoded URLs`, 'red');
    log('   Please replace them with apiClient from @/utils/apiClient', 'yellow');
  }
  log('='.repeat(60) + '\n', 'cyan');
  
  return allPassed;
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
