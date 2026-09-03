import fs from 'node:fs';

const filePath = process.argv[2];

if (!filePath) {
  console.error('File path is required');
  process.exit(1);
}

const original = fs.readFileSync(filePath, 'utf8');

const updated = original
  .replace(/(from\s+['"][^'"]+)\.(ts|tsx)(['"])/g, '$1$3')
  .replace(/(import\s+['"][^'"]+)\.(ts|tsx)(['"])/g, '$1$3');

if (updated !== original) {
  fs.writeFileSync(filePath, updated, 'utf8');
}
