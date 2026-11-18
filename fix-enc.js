const fs = require('fs');
const path = require('path');

function isValidUTF8(buffer) {
    let i = 0;
    while (i < buffer.length) {
        if (buffer[i] <= 0x7F) {
            i++;
        } else if ((buffer[i] >= 0xC2 && buffer[i] <= 0xDF) && (buffer[i + 1] >= 0x80 && buffer[i + 1] <= 0xBF)) {
            i += 2;
        } else if (
            (buffer[i] === 0xE0 && buffer[i + 1] >= 0xA0 && buffer[i + 1] <= 0xBF && buffer[i + 2] >= 0x80 && buffer[i + 2] <= 0xBF) ||
            (buffer[i] >= 0xE1 && buffer[i] <= 0xEC && buffer[i + 1] >= 0x80 && buffer[i + 1] <= 0xBF && buffer[i + 2] >= 0x80 && buffer[i + 2] <= 0xBF) ||
            (buffer[i] === 0xED && buffer[i + 1] >= 0x80 && buffer[i + 1] <= 0x9F && buffer[i + 2] >= 0x80 && buffer[i + 2] <= 0xBF) ||
            (buffer[i] >= 0xEE && buffer[i] <= 0xEF && buffer[i + 1] >= 0x80 && buffer[i + 1] <= 0xBF && buffer[i + 2] >= 0x80 && buffer[i + 2] <= 0xBF)
        ) {
            i += 3;
        } else if (
            (buffer[i] === 0xF0 && buffer[i + 1] >= 0x90 && buffer[i + 1] <= 0xBF && buffer[i + 2] >= 0x80 && buffer[i + 2] <= 0xBF && buffer[i + 3] >= 0x80 && buffer[i + 3] <= 0xBF) ||
            (buffer[i] >= 0xF1 && buffer[i] <= 0xF3 && buffer[i + 1] >= 0x80 && buffer[i + 1] <= 0xBF && buffer[i + 2] >= 0x80 && buffer[i + 2] <= 0xBF && buffer[i + 3] >= 0x80 && buffer[i + 3] <= 0xBF) ||
            (buffer[i] === 0xF4 && buffer[i + 1] >= 0x80 && buffer[i + 1] <= 0x8F && buffer[i + 2] >= 0x80 && buffer[i + 2] <= 0xBF && buffer[i + 3] >= 0x80 && buffer[i + 3] <= 0xBF)
        ) {
            i += 4;
        } else {
            return false;
        }
    }
    return true;
}

function walk(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const filePath = path.join(dir, file);
        if (fs.statSync(filePath).isDirectory()) {
            walk(filePath);
        } else if (filePath.endsWith('.ts') || filePath.endsWith('.tsx')) {
            const buf = fs.readFileSync(filePath);
            if (!isValidUTF8(buf)) {
                // To decode Windows-1252 properly to UTF-8
                // Node's Buffer doesn't support 'win1252' natively, but 'binary' or 'latin1' is an alias for it.
                const str = buf.toString('latin1'); 
                fs.writeFileSync(filePath, str, 'utf8');
                console.log('Fixed encoding for:', filePath);
            }
        }
    }
}

walk('src');