const fs = require('fs');
const path = require('path');

const files = [
  'src/app/services/business/business-analysis/page.tsx',
  'src/app/services/business/business-plans/page.tsx',
  'src/app/services/business/presentation-design/page.tsx',
  'src/app/services/data-analysis/excel-data-analysis/page.tsx',
  'src/app/services/data-analysis/quantitative-data-analysis/page.tsx',
  'src/app/services/data-analysis/spss-data-analysis-services/page.tsx',
  'src/app/services/data-analysis/stata-statistical-analysis/page.tsx',
  'src/app/services/data-analysis/survey-data-analysis/page.tsx',
  'src/app/services/marketing/graphic-design/page.tsx',
  'src/app/services/research/data-collection/page.tsx',
  'src/app/services/research/literature-research/page.tsx',
  'src/app/services/research/proofreading/page.tsx',
  'src/app/services/research/survey-design/page.tsx',
  'src/app/services/technical/ai-development/page.tsx',
];

// Only operate on JS object string-literal property lines: start with optional
// whitespace, then an identifier, then ':' then a single quote.
// These are NEVER JSX text (JSX attributes use '=', prose isn't 'prop: '").
const propLine = /^\s*[A-Za-z_$][\w$]*:\s*'/;

for (const f of files) {
  const full = path.join(process.cwd(), f);
  const lines = fs.readFileSync(full, 'utf8').split('\n');
  let changed = 0;
  const out = lines.map((line) => {
    if (!propLine.test(line)) return line;
    // Escape contraction/possessive apostrophes: letter ' letter
    const fixed = line.replace(/(\w)'(\w)/g, "$1\\'$2");
    if (fixed !== line) changed++;
    return fixed;
  });
  if (changed > 0) {
    fs.writeFileSync(full, out.join('\n'));
    console.log(`Fixed ${changed} line(s) in ${f}`);
  } else {
    console.log(`No changes in ${f}`);
  }
}
console.log('Done.');
