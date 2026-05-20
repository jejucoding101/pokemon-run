import * as THREE from 'three';
import { getBiomeAt } from './biomes';
import { hash2d } from './random';
import { getTerrainHeight } from './terrain';

export function buildBiomeProps(seed: number): THREE.Group {
  const group = new THREE.Group();
  const trunkMaterial = new THREE.MeshStandardMaterial({ color: '#72563b', roughness: 0.84 });
  const rockMaterial = new THREE.MeshStandardMaterial({ color: '#7d7a72', roughness: 0.9 });

  for (let ix = -90; ix <= 90; ix += 6) {
    for (let iz = -90; iz <= 90; iz += 6) {
      const jitterX = (hash2d(ix, iz, seed) - 0.5) * 4;
      const jitterZ = (hash2d(ix + 13, iz - 19, seed) - 0.5) * 4;
      const x = ix + jitterX;
      const z = iz + jitterZ;
      const distance = Math.hypot(x, z);

      if (distance < 20 || distance > 105) {
        continue;
      }

      const chance = hash2d(ix - 51, iz + 7, seed);
      const biome = getBiomeAt(x, z);

      if (biome.id === 'forest' && chance > 0.22) {
        addTree(group, x, z, seed, trunkMaterial, '#2f9b60');
      } else if (biome.id === 'meadow' && chance > 0.72) {
        addTree(group, x, z, seed, trunkMaterial, '#6fc472');
      } else if (biome.id === 'desert' && chance > 0.86) {
        addCactus(group, x, z, seed);
      } else if ((biome.id === 'snow' || biome.id === 'canyon' || biome.id === 'volcano') && chance > 0.62) {
        addRock(group, x, z, seed, rockMaterial);
      }
    }
  }

  return group;
}

function addTree(
  group: THREE.Group,
  x: number,
  z: number,
  seed: number,
  trunkMaterial: THREE.Material,
  leafColor: THREE.ColorRepresentation,
): void {
  const y = getTerrainHeight(x, z, seed);
  const scale = 0.8 + hash2d(Math.floor(x), Math.floor(z), seed + 88) * 0.8;
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.22 * scale, 0.34 * scale, 2.4 * scale, 7), trunkMaterial);
  trunk.position.set(x, y + 1.2 * scale, z);
  trunk.castShadow = true;
  group.add(trunk);

  const leaves = new THREE.Mesh(
    new THREE.ConeGeometry(1.45 * scale, 3.2 * scale, 8),
    new THREE.MeshStandardMaterial({ color: leafColor, roughness: 0.82 }),
  );
  leaves.position.set(x, y + 3.0 * scale, z);
  leaves.castShadow = true;
  group.add(leaves);
}

function addCactus(group: THREE.Group, x: number, z: number, seed: number): void {
  const y = getTerrainHeight(x, z, seed);
  const cactus = new THREE.Mesh(
    new THREE.CylinderGeometry(0.35, 0.45, 2.7, 7),
    new THREE.MeshStandardMaterial({ color: '#4f9b5d', roughness: 0.8 }),
  );
  cactus.position.set(x, y + 1.35, z);
  cactus.castShadow = true;
  group.add(cactus);
}

function addRock(group: THREE.Group, x: number, z: number, seed: number, material: THREE.Material): void {
  const y = getTerrainHeight(x, z, seed);
  const scale = 0.5 + hash2d(Math.floor(x), Math.floor(z), seed + 121) * 1.4;
  const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(scale, 0), material);
  rock.position.set(x, y + scale * 0.45, z);
  rock.rotation.set(hash2d(x, z, seed) * 2, hash2d(x + 8, z, seed) * 3, 0);
  rock.castShadow = true;
  rock.receiveShadow = true;
  group.add(rock);
}
