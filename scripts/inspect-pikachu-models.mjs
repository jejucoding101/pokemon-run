const owner = 'Pokemon-3D-api';
const repo = 'assets';
const branch = 'main';
const dexId = '25';
const apiRoot = `https://api.github.com/repos/${owner}/${repo}/contents/models/opt`;
const rawRoot = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/models/opt`;

async function getJson(url) {
  const response = await fetch(url, {
    headers: {
      Accept: 'application/vnd.github+json',
      'User-Agent': 'pokemon-run-inspector',
    },
  });
  if (!response.ok) {
    throw new Error(`Failed ${url}: ${response.status} ${response.statusText}`);
  }
  return response.json();
}

async function getArrayBuffer(url) {
  const response = await fetch(url, {
    headers: { 'User-Agent': 'pokemon-run-inspector' },
  });
  if (!response.ok) {
    throw new Error(`Failed ${url}: ${response.status} ${response.statusText}`);
  }
  return response.arrayBuffer();
}

function readGlbAnimations(arrayBuffer) {
  const bytes = new Uint8Array(arrayBuffer);
  const view = new DataView(bytes.buffer);

  const magic = view.getUint32(0, true);
  const version = view.getUint32(4, true);
  if (magic !== 0x46546c67 || version !== 2) {
    throw new Error('Not a valid glTF 2.0 binary GLB file');
  }

  let offset = 12;
  while (offset < bytes.byteLength) {
    const chunkLength = view.getUint32(offset, true);
    const chunkType = view.getUint32(offset + 4, true);
    const chunkStart = offset + 8;
    const chunkEnd = chunkStart + chunkLength;

    if (chunkType === 0x4e4f534a) {
      const jsonText = new TextDecoder().decode(bytes.slice(chunkStart, chunkEnd));
      const gltf = JSON.parse(jsonText);
      return (gltf.animations ?? []).map((animation, index) => ({
        index: index + 1,
        name: animation.name || '(unnamed)',
        channels: animation.channels?.length ?? 0,
      }));
    }

    offset = chunkEnd;
  }

  throw new Error('Missing JSON chunk');
}

function isPikachuFile(name) {
  const lower = name.toLowerCase();
  return (
    lower === `${dexId}.glb` ||
    lower.startsWith(`${dexId}-`) ||
    lower.includes('pikachu')
  );
}

const categories = await getJson(`${apiRoot}?ref=${branch}`);
const candidates = [];

for (const category of categories.filter((item) => item.type === 'dir')) {
  const files = await getJson(`${apiRoot}/${category.name}?ref=${branch}`);
  for (const file of files.filter((item) => item.type === 'file' && item.name.endsWith('.glb'))) {
    if (!isPikachuFile(file.name)) {
      continue;
    }

    const rawUrl = `${rawRoot}/${category.name}/${file.name}`;
    let animations = [];
    let error = null;

    try {
      animations = readGlbAnimations(await getArrayBuffer(rawUrl));
    } catch (err) {
      error = err instanceof Error ? err.message : String(err);
    }

    candidates.push({
      category: category.name,
      file: file.name,
      sizeBytes: file.size,
      rawUrl,
      animations,
      error,
    });
  }
}

console.log(JSON.stringify(candidates, null, 2));

