const fs = require('fs');
const path = require('path');

function walk(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const filePath = path.join(dir, file);
        if (fs.statSync(filePath).isDirectory()) {
            walk(filePath);
        } else if (filePath.endsWith('.ts') || filePath.endsWith('.tsx')) {
            let content = fs.readFileSync(filePath, 'utf8');
            if (content.includes("import bcrypt from 'bcrypt';")) {
                content = content.replace(/import bcrypt from 'bcrypt';/g, "import bcrypt from 'bcryptjs';");
                fs.writeFileSync(filePath, content, 'utf8');
                console.log('Fixed:', filePath);
            }
        }
    }
}

walk('src');