import { spawn } from 'node:child_process';
import { EOL } from 'node:os';
import path from 'node:path';

const suppressedPattern = new RegExp(
  `\\bsrc[\\\\/]shared[\\\\/]gatewayClient[\\\\/]client\\.gen[\\\\/]`
);

const tscBin = path.resolve('node_modules', 'typescript', 'bin', 'tsc');

const tscProcess = spawn(process.execPath, [tscBin, '-b'], {
  stdio: ['ignore', 'pipe', 'pipe'],
});

const chunks = [];

tscProcess.stdout.on('data', chunk => {
  chunks.push(chunk);
});

tscProcess.stderr.on('data', chunk => {
  chunks.push(chunk);
});

tscProcess.on('close', code => {
  const combined = Buffer.concat(chunks).toString();
  const newline = combined.includes('\r\n') ? '\r\n' : '\n';

  const blockHeaderRegex =
    /^([^\r\n(]+)\((\d+),(\d+)\): error [^\r\n]*$/gm;

  const headers = [];
  let match;

  while ((match = blockHeaderRegex.exec(combined)) !== null) {
    headers.push({
      index: match.index,
      filePath: match[1],
      suppressed: suppressedPattern.test(match[1]),
    });
  }

  if (headers.length === 0) {
    if (combined.length > 0) {
      process.stdout.write(combined);
    }
    process.exit(code ?? 0);
    return;
  }

  const suppressedBlocks = [];
  const outputParts = [];

  let cursor = 0;

  for (let i = 0; i < headers.length; i++) {
    const { index, suppressed } = headers[i];
    const nextIndex = i + 1 < headers.length ? headers[i + 1].index : combined.length;

    if (cursor < index) {
      outputParts.push(combined.slice(cursor, index));
    }

    const block = combined.slice(index, nextIndex);

    if (suppressed) {
      suppressedBlocks.push(block);
    } else {
      outputParts.push(block);
    }

    cursor = nextIndex;
  }

  if (cursor < combined.length) {
    outputParts.push(combined.slice(cursor));
  }

  const finalOutput = outputParts.join('');
  if (finalOutput.length > 0) {
    process.stdout.write(finalOutput);
    if (!finalOutput.endsWith(newline)) {
      process.stdout.write(newline);
    }
  }

  if (suppressedBlocks.length > 0) {
    console.warn(
      `[tsc] Suppressed ${suppressedBlocks.length} diagnostic(s) from generated gateway client.`
    );
    if (process.env.DEBUG_TSC_SUPPRESSED === '1') {
      for (const block of suppressedBlocks) {
        console.warn(block.endsWith(newline) ? block.slice(0, -newline.length) : block);
      }
    }
  }

  const hasErrors = headers.some(header => !header.suppressed);

  if (hasErrors) {
    process.exit(code ?? 1);
    return;
  }

  process.exit(0);
});
