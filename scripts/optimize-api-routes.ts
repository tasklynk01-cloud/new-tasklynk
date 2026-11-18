#!/usr/bin/env tsx
/**
 * 🔴 API Routes Optimization Script
 * 
 * This script adds real-time data fetching configuration to all API routes
 * by adding the following exports:
 * 
 * export const dynamic = 'force-dynamic';
 * export const revalidate = 0;
 * 
 * Usage: npx tsx scripts/optimize-api-routes.ts [--dry-run]
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');

const API_DIR = path.join(process.cwd(), 'src', 'app', 'api');

// Configuration to add to route files
const CONFIG_LINES = [
  '// 🔴 DISABLE CACHING: Ensure real-time data',
  'export const dynamic = \'force-dynamic\';',
  'export const revalidate = 0;',
  '',
];

interface FileStats {
  path: string;
  hasConfig: boolean;
  needsUpdate: boolean;
}

function findRouteFiles(dir: string): string[] {
  const files: string[] = [];
  
  const items = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const item of items) {
    const fullPath = path.join(dir, item.name);
    
    if (item.isDirectory()) {
      files.push(...findRouteFiles(fullPath));
    } else if (item.isFile() && item.name === 'route.ts') {
      files.push(fullPath);
    }
  }
  
  return files;
}

function checkFileHasConfig(filePath: string): boolean {
  const content = fs.readFileSync(filePath, 'utf-8');
  return content.includes('export const dynamic') || 
         content.includes('force-dynamic');
}

function addConfigToFile(filePath: string): void {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  
  // Find the insertion point (after imports, before first export function)
  let insertIndex = 0;
  let foundFirstExport = false;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Skip imports and blank lines
    if (line.startsWith('import ') || line === '' || line.startsWith('//')) {
      insertIndex = i + 1;
      continue;
    }
    
    // Found first export function
    if (line.startsWith('export async function') || line.startsWith('export function')) {
      foundFirstExport = true;
      break;
    }
    
    // Stop if we find existing dynamic config
    if (line.includes('export const dynamic')) {
      return; // Already has config
    }
  }
  
  if (!foundFirstExport) {
    console.log(`⚠️  Could not find insertion point in ${filePath}`);
    return;
  }
  
  // Insert configuration
  lines.splice(insertIndex, 0, ...CONFIG_LINES);
  
  const newContent = lines.join('\n');
  fs.writeFileSync(filePath, newContent, 'utf-8');
}

async function optimizeApiRoutes() {
  console.log('🔍 API Routes Optimization Script\n');
  console.log('=' .repeat(60));
  console.log('');
  
  if (isDryRun) {
    console.log('🔍 DRY RUN MODE - No files will be modified\n');
  }
  
  // Find all route files
  console.log('📂 Scanning for route files...');
  const routeFiles = findRouteFiles(API_DIR);
  console.log(`Found ${routeFiles.length} route files\n`);
  
  // Analyze files
  const stats: FileStats[] = [];
  
  for (const file of routeFiles) {
    const hasConfig = checkFileHasConfig(file);
    const relativePath = path.relative(process.cwd(), file);
    
    stats.push({
      path: relativePath,
      hasConfig,
      needsUpdate: !hasConfig,
    });
  }
  
  // Display summary
  console.log('📊 Analysis Results');
  console.log('-'.repeat(60));
  
  const needsUpdate = stats.filter(s => s.needsUpdate);
  const alreadyConfigured = stats.filter(s => s.hasConfig);
  
  console.log(`✅ Already configured: ${alreadyConfigured.length}`);
  console.log(`⚠️  Needs update: ${needsUpdate.length}`);
  console.log('');
  
  if (needsUpdate.length > 0) {
    console.log('📝 Files needing updates:');
    console.log('-'.repeat(60));
    for (const file of needsUpdate) {
      console.log(`  • ${file.path}`);
    }
    console.log('');
  }
  
  if (isDryRun) {
    console.log('🔍 DRY RUN - No changes made');
    console.log('Run without --dry-run to apply changes');
    return;
  }
  
  // Apply updates
  if (needsUpdate.length > 0) {
    console.log('🔧 Applying updates...');
    console.log('-'.repeat(60));
    
    let successCount = 0;
    let errorCount = 0;
    
    for (const file of needsUpdate) {
      try {
        const fullPath = path.join(process.cwd(), file.path);
        addConfigToFile(fullPath);
        console.log(`  ✅ ${file.path}`);
        successCount++;
      } catch (error) {
        console.log(`  ❌ ${file.path}: ${error}`);
        errorCount++;
      }
    }
    
    console.log('');
    console.log('=' .repeat(60));
    console.log('✅ Optimization Complete');
    console.log('=' .repeat(60));
    console.log(`Successfully updated: ${successCount} files`);
    console.log(`Errors: ${errorCount} files`);
    console.log('');
    console.log('🎉 All API routes are now configured for real-time data!');
  } else {
    console.log('✅ All files already configured - no changes needed!');
  }
}

// Execute
optimizeApiRoutes()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Error:', error);
    process.exit(1);
  });
