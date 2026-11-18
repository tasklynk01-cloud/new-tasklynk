import fs from 'fs';
import path from 'path';
import { globSync } from 'glob';

// Find all files in src/app/admin
const files = globSync('src/app/admin/**/*.tsx');

let updatedFiles = 0;

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  let originalContent = content;
  
  // Replace direct `if (response.ok) {` with safe parsing 
  // ONLY if it looks like an action (has toast.success, toast.error, await response.json() in else branch)
  
  // We'll use a regex that matches:
  // if (response.ok) { ... } else { const data = await response.json(); toast.error(...) }
  // Actually, let's just make a better replacer for typical patterns:
  
  const blocks = content.match(/if\s*\((?:res|response)\.ok\)\s*\{[\s\S]*?\}?\s*else\s*\{[\s\S]*?(?:res|response)\.json\(\)[\s\S]*?\}/g);
  
  if (blocks) {
    for (const block of blocks) {
      if (block.includes('extractErrorMessage')) continue; // maybe skip? actually we want to fix these too!
      console.log(`Found pattern in ${file}`);
    }
  }
}
console.log(`Updated ${updatedFiles} files`);
