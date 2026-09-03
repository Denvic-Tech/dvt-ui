export const READ_QUERY_REGEX = /^\s*(SELECT|WITH)\b/i;

export function sanitizeSqlForBackend(src: string): string {
  const s = src ?? '';
  const n = s.length;
  let out = '';
  let i = 0;

  let inS = false; // '...'
  let inD = false; // "..."
  let inBT = false; // `...`
  let inSL = false; // -- ...
  let inML = false; // /* ... */
  let inDollarTag: string | null = null;

  while (i < n) {
    const ch = s[i];
    const ch2 = i + 1 < n ? s[i + 1] : '';

    if (!inS && !inD && !inBT && !inSL && !inML && !inDollarTag) {
      if (ch === '$') {
        let j = i + 1;
        while (j < n && /[A-Za-z0-9_]/.test(s[j])) j++;
        if (j < n && s[j] === '$') {
          inDollarTag = s.slice(i, j + 1);
          out += inDollarTag;
          i = j + 1;
          continue;
        }
      }
    } else if (inDollarTag) {
      if (s.startsWith(inDollarTag, i)) {
        out += inDollarTag;
        i += inDollarTag.length;
        inDollarTag = null;
      } else {
        out += ch;
        i++;
      }
      continue;
    }

    if (!inS && !inD && !inBT && !inML) {
      if (ch === '-' && ch2 === '-') {
        inSL = true;
        i += 2;
        continue;
      }
    }
    if (inSL) {
      if (ch === '\n') {
        inSL = false;
        out += '\n';
      }
      i++;
      continue;
    }

    if (!inS && !inD && !inBT && !inSL) {
      if (ch === '/' && ch2 === '*') {
        inML = true;
        i += 2;
        continue;
      }
    }
    if (inML) {
      if (ch === '*' && ch2 === '/') {
        inML = false;
        i += 2;
      } else {
        i++;
      }
      continue;
    }

    if (!inD && !inBT && ch === "'") {
      inS = !inS;
      out += ch;
      i++;
      continue;
    }
    if (!inS && !inBT && ch === '"') {
      inD = !inD;
      out += ch;
      i++;
      continue;
    }
    if (!inS && !inD && ch === '`') {
      inBT = !inBT;
      out += ch;
      i++;
      continue;
    }

    if (inS && ch === "'" && s[i + 1] === "'") {
      out += "''";
      i += 2;
      continue;
    }
    if (inD && ch === '"' && s[i + 1] === '"') {
      out += '""';
      i += 2;
      continue;
    }

    out += ch;
    i++;
  }

  return out
    .trim()
    .replace(/;+\s*$/g, '')
    .trim();
}
