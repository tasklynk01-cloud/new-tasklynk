import fs from 'fs';
import path from 'path';

function walk(dir: string, files: string[] = []) {
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      walk(filePath, files);
    } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
      files.push(filePath);
    }
  }
  return files;
}

const files = walk('src');
for (const file of files) {
  const content = fs.readFileSync(file, 'utf8');
  if (content.includes('db.transaction(')) {
    const lines = content.split('\n');
    let inTx = false;
    let braceCount = 0;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line.includes('db.transaction(')) {
        inTx = true;
        braceCount = (line.match(/{/g) || []).length - (line.match(/}/g) || []).length;
        continue;
      }
      
      if (inTx) {
        braceCount += (line.match(/{/g) || []).length - (line.match(/}/g) || []).length;
        if (line.includes('db.insert') || line.includes('db.update') || line.includes('db.delete') || line.includes('db.select') || line.includes('validateAndTransitionStatus') || line.includes('syncManagerWalletBalance')) {
           if (!line.includes('tx') && (!line.includes('import') && !line.includes('export'))) {
               // Only output if it calls the helper without tx, or uses db instead of tx
               if (line.includes('db.') || line.includes('validateAndTransitionStatus') || line.includes('syncManagerWalletBalance')) {
                  console.log(`${file}:${i+1}: ${line.trim()}`);
               }
           }
        }
        if (braceCount <= 0) {
          inTx = false;
        }
      }
    }
  }
}
