const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Run the python brand icon generator which generates multi-res ICO and PNGs
const pythonScript = path.join(__dirname, 'update-brand-icons.py');
try {
  console.log('Generating brand icons and favicons...');
  execSync(`python "${pythonScript}"`, { stdio: 'inherit' });
  console.log('✅ Favicons and brand icons generated successfully.');
} catch (error) {
  console.error('❌ Error generating brand icons:', error);
  process.exit(1);
}
