#!/usr/bin/env node

/**
 * Script to convert raw rate data to the format needed by the application
 * This script checks for required dependencies and runs the conversion utility
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Ensure data directory exists
const dataDir = path.join(__dirname, '../data');
if (!fs.existsSync(dataDir)) {
  console.log('Creating data directory...');
  fs.mkdirSync(dataDir, { recursive: true });
}

// Check for required dependencies
try {
  require('uuid');
} catch (error) {
  console.log('Installing uuid package...');
  execSync('npm install uuid', { stdio: 'inherit' });
}

// Run the conversion
console.log('Converting rates from raw JSON to RateConfiguration format...');
const { convertRates } = require('../utils/convertRates');
const convertedRates = convertRates();

console.log(`\nConversion complete! ${convertedRates.length} rates have been converted.`);
console.log('\nNext steps:');
console.log('1. Review the converted rates in data/convertedRates.json');
console.log('2. Use the converted rates in your application by importing them into your rate repository');
console.log('3. To use these rates in your application, you can add the following code to your rate repository:');
console.log('\n   import convertedRates from \'@/data/convertedRates.json\';');
console.log('   // Then use the convertedRates array in your rate repository\n'); 