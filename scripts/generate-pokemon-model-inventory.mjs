import { writeFile, mkdir } from 'node:fs/promises';

const owner = 'Pokemon-3D-api';
const repo = 'assets';
const branch = 'main';
const apiRoot = `https://api.github.com/repos/${owner}/${repo}/contents/models/opt`;
const rawRoot = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/models/opt`;
const outputPath = 'docs/pokemon-model-action-inventory.md';
const concurrency = 24;

async function getJson(url) {
  const response = await fetch(url, {
    headers: {
      Accept: 'application/vnd.github+json',
      'User-Agent': 'pokemon-run-inventory-generator',
    },
  });
  if (!response.ok) {
    throw new Error(`Failed ${url}: ${response.status} ${response.statusText}`);
  }
  return response.json();
}

async function getBytes(url, range) {
  const response = await fetch(url, {
    headers: {
      Range: range,
      'User-Agent': 'pokemon-run-inventory-generator',
    },
  });
  if (!response.ok && response.status !== 206) {
    throw new Error(`Failed ${url}: ${response.status} ${response.statusText}`);
  }
  return new Uint8Array(await response.arrayBuffer());
}

function getUint32(bytes, offset) {
  return new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength).getUint32(offset, true);
}

async function readGlbAnimations(rawUrl) {
  const header = await getBytes(rawUrl, 'bytes=0-19');
  if (header.byteLength < 20) {
    throw new Error('GLB header too short');
  }

  const magic = getUint32(header, 0);
  const version = getUint32(header, 4);
  if (magic !== 0x46546c67 || version !== 2) {
    throw new Error('Not a valid glTF 2.0 binary GLB file');
  }

  const jsonLength = getUint32(header, 12);
  const jsonType = getUint32(header, 16);
  if (jsonType !== 0x4e4f534a) {
    throw new Error('First GLB chunk is not JSON');
  }

  const jsonBytes = await getBytes(rawUrl, `bytes=20-${19 + jsonLength}`);
  const jsonText = new TextDecoder().decode(jsonBytes);
  const gltf = JSON.parse(jsonText);

  return (gltf.animations ?? []).map((animation, index) => ({
    index: index + 1,
    name: animation.name || '(unnamed)',
    channels: animation.channels?.length ?? 0,
  }));
}

function parseDexId(fileName) {
  const match = fileName.match(/^(\d+)/);
  return match ? Number(match[1]) : null;
}

function escapeCell(value) {
  return String(value).replaceAll('|', '\\|').replaceAll('\n', ' ');
}

function formatBytes(bytes) {
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

function animationNames(animations) {
  if (animations.length === 0) {
    return 'None';
  }
  return animations.map((animation) => animation.name).join(', ');
}

const categories = await getJson(`${apiRoot}?ref=${branch}`);
const candidates = [];

for (const category of categories.filter((item) => item.type === 'dir')) {
  const files = await getJson(`${apiRoot}/${category.name}?ref=${branch}`);
  const glbFiles = files.filter((item) => item.type === 'file' && item.name.toLowerCase().endsWith('.glb'));

  for (const file of glbFiles) {
    candidates.push({
      dexId: parseDexId(file.name),
      category: category.name,
      file: file.name,
      sizeBytes: file.size,
      rawUrl: `${rawRoot}/${category.name}/${file.name}`,
    });
  }

  console.log(`Queued ${category.name}: ${glbFiles.length} models`);
}

let nextIndex = 0;
let completed = 0;
const rows = [];
const errors = [];

async function worker() {
  while (nextIndex < candidates.length) {
    const candidate = candidates[nextIndex];
    nextIndex += 1;

    let animations = [];
    let error = null;

    try {
      animations = await readGlbAnimations(candidate.rawUrl);
    } catch (err) {
      error = err instanceof Error ? err.message : String(err);
      errors.push({
        category: candidate.category,
        file: candidate.file,
        rawUrl: candidate.rawUrl,
        error,
      });
    }

    rows.push({
      ...candidate,
      animationCount: animations.length,
      animations,
      error,
    });

    completed += 1;
    if (completed % 100 === 0 || completed === candidates.length) {
      console.log(`Inspected ${completed}/${candidates.length}`);
    }
  }
}

await Promise.all(Array.from({ length: concurrency }, () => worker()));

rows.sort((a, b) => {
  const dexA = a.dexId ?? Number.MAX_SAFE_INTEGER;
  const dexB = b.dexId ?? Number.MAX_SAFE_INTEGER;
  return dexA - dexB || a.category.localeCompare(b.category) || a.file.localeCompare(b.file);
});

const generatedAt = new Date().toISOString().slice(0, 10);
const categoryCounts = new Map();
const animationCounts = new Map();

for (const row of rows) {
  categoryCounts.set(row.category, (categoryCounts.get(row.category) ?? 0) + 1);
  if (row.animationCount > 0) {
    animationCounts.set(row.category, (animationCounts.get(row.category) ?? 0) + 1);
  }
}

const lines = [];
lines.push('# Pokemon Model Action Inventory');
lines.push('');
lines.push(`Generated: ${generatedAt}`);
lines.push('');
lines.push('Source:');
lines.push('');
lines.push('- Repository: https://github.com/Pokemon-3D-api/assets');
lines.push('- Model root: `models/opt`');
lines.push('- Format: optimized GLB files');
lines.push('');
lines.push('## Summary');
lines.push('');
lines.push(`- Total model files scanned: ${rows.length}`);
lines.push(`- Model files with embedded animations: ${rows.filter((row) => row.animationCount > 0).length}`);
lines.push(`- Model files without embedded animations: ${rows.filter((row) => row.animationCount === 0).length}`);
lines.push(`- Files with inspection errors: ${errors.length}`);
lines.push('');
lines.push('### Category Counts');
lines.push('');
lines.push('| Category | Models | Models With Animations |');
lines.push('|---|---:|---:|');
for (const [category, count] of [...categoryCounts.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
  lines.push(`| \`${category}\` | ${count} | ${animationCounts.get(category) ?? 0} |`);
}
lines.push('');
lines.push('## Full Inventory');
lines.push('');
lines.push('| Dex ID | Variant | File | Size | Action Count | Action Names | URL |');
lines.push('|---:|---|---|---:|---:|---|---|');
for (const row of rows) {
  lines.push(
    `| ${row.dexId ?? ''} | \`${escapeCell(row.category)}\` | \`${escapeCell(row.file)}\` | ${formatBytes(row.sizeBytes)} | ${row.animationCount} | ${escapeCell(animationNames(row.animations))} | [GLB](${row.rawUrl}) |`,
  );
}

if (errors.length > 0) {
  lines.push('');
  lines.push('## Inspection Errors');
  lines.push('');
  lines.push('| Variant | File | Error | URL |');
  lines.push('|---|---|---|---|');
  for (const error of errors) {
    lines.push(
      `| \`${escapeCell(error.category)}\` | \`${escapeCell(error.file)}\` | ${escapeCell(error.error)} | [GLB](${error.rawUrl}) |`,
    );
  }
}

lines.push('');
lines.push('## Notes');
lines.push('');
lines.push('- `Action Count` means embedded glTF animation clip count.');
lines.push('- Many models have no embedded idle/run/jump clips. They can still be used with procedural movement animation.');
lines.push('- Dex ID is inferred from the start of the GLB filename.');
lines.push('- For gameplay mapping, inspect action names before assigning them to `idle`, `run`, `jump`, or `attack`.');
lines.push('');

await mkdir('docs', { recursive: true });
await writeFile(outputPath, `${lines.join('\n')}\n`, 'utf8');

console.log(`Wrote ${outputPath}`);
console.log(`Total model files: ${rows.length}`);
console.log(`With animations: ${rows.filter((row) => row.animationCount > 0).length}`);
console.log(`Inspection errors: ${errors.length}`);
