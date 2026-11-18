/* Generate Alex's link allowlist from actual published route metadata, not AI text. */
const fs = require("node:fs");
const path = require("node:path");
const ts = require("typescript");
const root = path.resolve(__dirname, "..");
const records = [];
function walk(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) walk(file);
    else if (entry.name === "page.tsx") {
      const source = ts.createSourceFile(file, fs.readFileSync(file, "utf8"), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
      function visit(node) {
        if (ts.isCallExpression(node) && /^(generateServicePageMetadata|generateContentMetadata)$/.test(node.expression.getText(source))) {
          const [title, description, href] = node.arguments;
          if ([title, description, href].every(value => value && ts.isStringLiteral(value)) && href.text.startsWith("/services/")) {
            records.push({ id: href.text, title: title.text.split(/\s[|—]\s/)[0], description: description.text, href: href.text });
          }
        }
        ts.forEachChild(node, visit);
      }
      visit(source);
    }
  }
}
walk(path.join(root, "src", "app", "services"));
records.sort((a, b) => a.href.localeCompare(b.href));
fs.mkdirSync(path.join(root, "src", "lib", "alex"), { recursive: true });
fs.writeFileSync(path.join(root, "src", "lib", "alex", "published-services.json"), JSON.stringify(records, null, 2) + "\n");
console.log(`Generated ${records.length} verified TaskLynk service links.`);