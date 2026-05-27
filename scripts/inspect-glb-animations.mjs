const url =
  'https://raw.githubusercontent.com/Pokemon-3D-api/assets/main/models/opt/regular/25.glb';

const response = await fetch(url);
if (!response.ok) {
  throw new Error(`Failed to fetch GLB: ${response.status} ${response.statusText}`);
}

const bytes = new Uint8Array(await response.arrayBuffer());
const view = new DataView(bytes.buffer);

const magic = view.getUint32(0, true);
const version = view.getUint32(4, true);
if (magic !== 0x46546c67 || version !== 2) {
  throw new Error('Not a valid glTF 2.0 binary GLB file');
}

let offset = 12;
const chunks = [];

while (offset < bytes.byteLength) {
  const chunkLength = view.getUint32(offset, true);
  const chunkType = view.getUint32(offset + 4, true);
  const chunkStart = offset + 8;
  const chunkEnd = chunkStart + chunkLength;
  chunks.push({ chunkType, chunkStart, chunkEnd });
  offset = chunkEnd;
}

const jsonChunk = chunks.find((chunk) => chunk.chunkType === 0x4e4f534a);
if (!jsonChunk) {
  throw new Error('Missing JSON chunk');
}

const jsonText = new TextDecoder().decode(bytes.slice(jsonChunk.chunkStart, jsonChunk.chunkEnd));
const gltf = JSON.parse(jsonText);
const animations = gltf.animations ?? [];

console.log(`Model: ${url}`);
console.log(`Animations: ${animations.length}`);

for (const [index, animation] of animations.entries()) {
  console.log(`${index + 1}. ${animation.name || '(unnamed)'}`);
  console.log(`   channels: ${animation.channels?.length ?? 0}`);
}

