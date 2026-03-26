import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const filePath = path.join(__dirname, '../client/src/App.tsx');
let s = fs.readFileSync(filePath, 'utf8');

// Replace each className={`...${...}...`} with concatenation form.
// Match: className={` + (optional prefix) + ${expr} + (optional suffix) + `}
const re = /className=\{\`([^`]*)\$\{([^}]+)\}([^`]*)\`\}/g;

let out = s.replace(re, (_, before, expr, after) => {
  const b = before.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
  const a = after.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
  let result = 'className={';
  if (b) result += "'" + b + "' + ";
  result += '(' + expr + ')';
  if (a) result += " + '" + a + "'";
  result += '}';
  return result;
});

const remaining = (out.match(/className=\{\`/g) || []).length;
console.log('Remaining template literals in className:', remaining);

fs.writeFileSync(filePath, out);
console.log('Done.');
