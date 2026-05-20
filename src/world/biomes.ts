import * as THREE from 'three';

export type BiomeId = 'meadow' | 'forest' | 'desert' | 'snow' | 'canyon' | 'volcano' | 'sky';

export type BiomeDefinition = {
  id: BiomeId;
  label: string;
  color: THREE.ColorRepresentation;
  accent: THREE.ColorRepresentation;
  roughness: number;
  heightBoost: number;
};

export const BIOMES: Record<BiomeId, BiomeDefinition> = {
  meadow: {
    id: 'meadow',
    label: '시작 초원',
    color: '#65b96b',
    accent: '#a9dd72',
    roughness: 0.9,
    heightBoost: 0.2,
  },
  forest: {
    id: 'forest',
    label: '깊은 숲',
    color: '#2f7d57',
    accent: '#6bc083',
    roughness: 1.3,
    heightBoost: 0.6,
  },
  desert: {
    id: 'desert',
    label: '사막 폐허',
    color: '#d4b260',
    accent: '#f2d68b',
    roughness: 0.7,
    heightBoost: 0.1,
  },
  snow: {
    id: 'snow',
    label: '설산',
    color: '#d6e7ee',
    accent: '#8db8cd',
    roughness: 1.8,
    heightBoost: 3.5,
  },
  canyon: {
    id: 'canyon',
    label: '바위 협곡',
    color: '#a9654d',
    accent: '#d79461',
    roughness: 1.6,
    heightBoost: 1.8,
  },
  volcano: {
    id: 'volcano',
    label: '화산 지대',
    color: '#3f3331',
    accent: '#f05f36',
    roughness: 2.1,
    heightBoost: 2.8,
  },
  sky: {
    id: 'sky',
    label: '하늘섬',
    color: '#79b7df',
    accent: '#f7f2ba',
    roughness: 0.8,
    heightBoost: 5,
  },
};

export function getBiomeAt(x: number, z: number): BiomeDefinition {
  const distance = Math.hypot(x, z);

  if (distance < 22) {
    return BIOMES.meadow;
  }

  const angle = Math.atan2(z, x);
  if (distance > 78) {
    return BIOMES.volcano;
  }

  if (angle > -Math.PI / 4 && angle <= Math.PI / 4) {
    return BIOMES.desert;
  }

  if (angle > Math.PI / 4 && angle <= (3 * Math.PI) / 4) {
    return BIOMES.snow;
  }

  if (angle <= -Math.PI / 4 && angle > (-3 * Math.PI) / 4) {
    return BIOMES.forest;
  }

  return BIOMES.canyon;
}
