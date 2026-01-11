#!/usr/bin/env node
/**
 * Test script to verify Figma API access
 */

import { fetchFigmaVariables, FigmaAPIError } from '../src/api/figma-client.js';

const fileKey = process.argv[2] || 'yXrKvOiasANQdT4DSq3aH1';
const accessToken = process.env.FIGMA_ACCESS_TOKEN;

if (!accessToken) {
  console.error('❌ FIGMA_ACCESS_TOKEN not set');
  console.log('\nSet it with:');
  console.log('  export FIGMA_ACCESS_TOKEN="your-token"');
  process.exit(1);
}

console.log(`🔍 Testing Figma API access...`);
console.log(`📁 File key: ${fileKey}`);
console.log(`🔑 Token: ${accessToken.substring(0, 10)}...`);
console.log('');

try {
  console.log('📡 Fetching variables from Figma...\n');
  const response = await fetchFigmaVariables(fileKey, accessToken);

  console.log('✅ Successfully connected to Figma!\n');
  console.log(`📊 Response status: ${response.status}`);
  console.log(`❌ Error flag: ${response.error}\n`);

  const variableCount = Object.keys(response.meta.variables).length;
  const collectionCount = Object.keys(response.meta.variableCollections).length;

  console.log(`📦 Collections: ${collectionCount}`);
  console.log(`🎨 Variables: ${variableCount}\n`);

  if (collectionCount === 0) {
    console.log('⚠️  No variable collections found in this file.');
    console.log('\nTo add variables:');
    console.log('  1. Open the file in Figma');
    console.log('  2. Right-click → Variables → Create variable');
    console.log('  3. Add a test color, number, or string variable');
    console.log('  4. Run this script again\n');
  } else {
    console.log('Collections found:');
    Object.values(response.meta.variableCollections).forEach((col) => {
      console.log(`  📁 ${col.name}`);
      console.log(`     Variables: ${col.variableIds.length}`);
      console.log(`     Modes: ${col.modes.map((m) => m.name).join(', ')}\n`);
    });

    if (variableCount > 0) {
      console.log('Sample variables:');
      Object.values(response.meta.variables)
        .slice(0, 5)
        .forEach((v) => {
          console.log(`  🎨 ${v.name} (${v.resolvedType})`);
        });
    }
  }
} catch (error) {
  if (error instanceof FigmaAPIError) {
    console.error(`❌ Figma API Error (${error.status}): ${error.message}\n`);

    if (error.status === 403) {
      console.log('Possible causes:');
      console.log('  • File doesn\'t exist or you don\'t have access');
      console.log('  • Token was created from a different Figma account');
      console.log('  • File doesn\'t have Variables enabled\n');
    } else if (error.status === 404) {
      console.log('File not found. Check the file key in the URL.\n');
    }
  } else {
    console.error('❌ Unexpected error:', error);
  }
  process.exit(1);
}
