import * as THREE from 'three';
import { getBiomeAt } from './biomes';
import { fbm2d } from './random';

export type TerrainConfig = {
  size: number;
  segments: number;
  seed: number;
};

export type TerrainSample = {
  height: number;
  biomeId: string;
};

export function getTerrainHeight(x: number, z: number, seed: number): number {
  const biome = getBiomeAt(x, z);
  const distance = Math.hypot(x, z);
  const islandFalloff = THREE.MathUtils.smoothstep(distance, 96, 118);
  const plainPocket = 1 - THREE.MathUtils.smoothstep(distance, 7, 21);
  const rolling = (fbm2d(x * 0.035, z * 0.035, seed, 5) - 0.5) * 12 * biome.roughness;
  const details = (fbm2d(x * 0.11, z * 0.11, seed + 23, 4) - 0.5) * 2.2;
  const ridge = Math.pow(fbm2d(x * 0.025 + 40, z * 0.025 - 11, seed + 71, 4), 3) * biome.heightBoost;
  const base = (rolling + details + ridge) * (1 - plainPocket * 0.9);

  return Math.max(-2.5, base * (1 - islandFalloff) - islandFalloff * 8);
}

export function createTerrain(config: TerrainConfig): THREE.Mesh {
  const geometry = new THREE.PlaneGeometry(config.size, config.size, config.segments, config.segments);
  geometry.rotateX(-Math.PI / 2);

  const position = geometry.getAttribute('position');
  const colors: number[] = [];
  const color = new THREE.Color();

  for (let i = 0; i < position.count; i += 1) {
    const x = position.getX(i);
    const z = position.getZ(i);
    const height = getTerrainHeight(x, z, config.seed);
    const biome = getBiomeAt(x, z);
    const shade = 0.84 + fbm2d(x * 0.08, z * 0.08, config.seed + 9, 3) * 0.22;

    position.setY(i, height);
    color.set(biome.color).multiplyScalar(shade);
    colors.push(color.r, color.g, color.b);
  }

  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  geometry.computeVertexNormals();

  const material = new THREE.MeshStandardMaterial({
    vertexColors: true,
    roughness: 0.88,
    metalness: 0.02,
  });

  const mesh = new THREE.Mesh(geometry, material);
  mesh.receiveShadow = true;
  return mesh;
}
