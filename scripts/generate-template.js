const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

// Ensure the templates directory exists
const templatesDir = path.join(__dirname, '../public/templates');
if (!fs.existsSync(templatesDir)) {
  fs.mkdirSync(templatesDir, { recursive: true });
}

// Check if xlsx is installed
try {
  require.resolve('xlsx');
  console.log('xlsx is already installed');
} catch (e) {
  console.log('Installing xlsx package...');
  execSync('npm install xlsx', { stdio: 'inherit' });
}

// Run the template generator
console.log('Generating rate template...');
require('../utils/generateRateTemplate');

console.log('\nTemplate generation complete!');
console.log('You can find the template at: public/templates/rate_template.xlsx');
console.log('\nTo use this template:');
console.log('1. Open the Excel file and fill in your rate data');
console.log('2. Navigate to the admin section of your application');
console.log('3. Use the Rate Importer to upload your filled template');
console.log('4. The rates will be imported into your application'); 