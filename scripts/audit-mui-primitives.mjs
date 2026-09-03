import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';

const root = path.join(process.cwd(), 'src');
const files = [];

const trackedJsxTags = new Set([
  'Alert',
  'Autocomplete',
  'Badge',
  'Button',
  'Card',
  'CardContent',
  'Checkbox',
  'Chip',
  'CircularProgress',
  'Dialog',
  'DialogActions',
  'DialogContent',
  'DialogTitle',
  'Drawer',
  'FormControl',
  'FormControlLabel',
  'IconButton',
  'Menu',
  'MenuItem',
  'Radio',
  'RadioGroup',
  'Select',
  'Skeleton',
  'Switch',
  'Tab',
  'Table',
  'TableBody',
  'TableCell',
  'TableHead',
  'TableRow',
  'Tabs',
  'TextField',
  'Tooltip',
]);

const walk = directoryPath => {
  for (const entry of fs.readdirSync(directoryPath, { withFileTypes: true })) {
    const fullPath = path.join(directoryPath, entry.name);

    if (entry.isDirectory()) {
      walk(fullPath);
      continue;
    }

    if (/\.(ts|tsx)$/.test(entry.name)) {
      files.push(fullPath);
    }
  }
};

walk(root);

const importStats = new Map();
const jsxStats = new Map();

const bump = (bucket, key) => {
  bucket.set(key, (bucket.get(key) ?? 0) + 1);
};

for (const file of files) {
  const sourceText = fs.readFileSync(file, 'utf8');
  const sourceFile = ts.createSourceFile(
    file,
    sourceText,
    ts.ScriptTarget.Latest,
    true,
    file.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS
  );

  const visit = node => {
    if (ts.isImportDeclaration(node) && ts.isStringLiteral(node.moduleSpecifier)) {
      const source = node.moduleSpecifier.text;

      if (source.startsWith('@mui/material') || source.startsWith('@mui/x-')) {
        const importClause = node.importClause;

        if (importClause?.name) {
          bump(importStats, importClause.name.text);
        }

        const namedBindings = importClause?.namedBindings;
        if (namedBindings && ts.isNamedImports(namedBindings)) {
          for (const element of namedBindings.elements) {
            bump(
              importStats,
              element.propertyName ? element.propertyName.text : element.name.text
            );
          }
        }

        if (
          !namedBindings &&
          !importClause?.name &&
          source.startsWith('@mui/material/')
        ) {
          bump(importStats, path.basename(source));
        }
      }
    }

    if (ts.isJsxSelfClosingElement(node) || ts.isJsxOpeningElement(node)) {
      const tagName = node.tagName.getText(sourceFile);

      if (trackedJsxTags.has(tagName)) {
        const stats =
          jsxStats.get(tagName) ??
          {
            count: 0,
            props: new Map(),
            values: new Map(),
          };

        stats.count += 1;

        for (const attribute of node.attributes.properties) {
          if (!ts.isJsxAttribute(attribute)) {
            continue;
          }

          const propName = attribute.name.text;
          bump(stats.props, propName);

          if (
            ['variant', 'size', 'color', 'severity'].includes(propName) &&
            attribute.initializer
          ) {
            const rawValue = attribute.initializer
              .getText(sourceFile)
              .replace(/^[{"']+|[}"']+$/g, '');
            bump(stats.values, `${propName}=${rawValue}`);
          }
        }

        jsxStats.set(tagName, stats);
      }
    }

    ts.forEachChild(node, visit);
  };

  visit(sourceFile);
}

console.log('== MUI import usage ==');
for (const [name, count] of [...importStats.entries()].sort(
  (left, right) => right[1] - left[1] || left[0].localeCompare(right[0])
)) {
  console.log(`${String(count).padStart(4, ' ')}  ${name}`);
}

console.log('\n== JSX usage patterns ==');
for (const [name, stats] of [...jsxStats.entries()].sort(
  (left, right) => right[1].count - left[1].count || left[0].localeCompare(right[0])
)) {
  const topProps = [...stats.props.entries()]
    .sort((left, right) => right[1] - left[1])
    .slice(0, 8)
    .map(([propName, count]) => `${propName}:${count}`)
    .join(', ');

  const topValues = [...stats.values.entries()]
    .sort((left, right) => right[1] - left[1])
    .slice(0, 6)
    .map(([value, count]) => `${value}:${count}`)
    .join(', ');

  console.log(`\n# ${name} (${stats.count})`);
  if (topProps) {
    console.log(`props   ${topProps}`);
  }
  if (topValues) {
    console.log(`values  ${topValues}`);
  }
}
