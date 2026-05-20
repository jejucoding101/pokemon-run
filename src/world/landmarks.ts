import * as THREE from 'three';
import { getTerrainHeight } from './terrain';

export type Landmark = {
  id: string;
  label: string;
  position: THREE.Vector3;
  color: THREE.ColorRepresentation;
  radius: number;
};

export function createLandmarks(seed: number): Landmark[] {
  const raw = [
    ['village', '중앙 마을', 0, 0, '#74e2b3', 6],
    ['forest-gate', '숲 입구', -42, -34, '#49c178', 4],
    ['snow-peak', '설산 전망대', -12, 58, '#ccecff', 4],
    ['desert-ruin', '사막 폐허', 55, 18, '#f4c96f', 5],
    ['canyon-bridge', '협곡 다리', -64, 22, '#da8f61', 4],
    ['volcano-arena', '화산 아레나', 72, -70, '#ff6a3d', 6],
    ['sky-portal', '하늘섬 포탈', 24, -58, '#93d7ff', 4],
    ['cave-mouth', '지하 동굴', -22, -68, '#b78cff', 4],
  ] as const;

  return raw.map(([id, label, x, z, color, radius]) => {
    const height = getTerrainHeight(x, z, seed);
    return {
      id,
      label,
      position: new THREE.Vector3(x, height + 0.2, z),
      color,
      radius,
    };
  });
}

export function buildLandmarkObjects(landmarks: Landmark[]): THREE.Group {
  const group = new THREE.Group();

  for (const landmark of landmarks) {
    if (landmark.id === 'village') {
      buildVillage(group, landmark);
      continue;
    }

    const marker = new THREE.Mesh(
      new THREE.CylinderGeometry(landmark.radius * 0.24, landmark.radius * 0.42, 7, 8),
      new THREE.MeshStandardMaterial({
        color: landmark.color,
        emissive: landmark.color,
        emissiveIntensity: 0.18,
        roughness: 0.58,
      }),
    );
    marker.position.copy(landmark.position).add(new THREE.Vector3(0, 3.5, 0));
    marker.castShadow = true;
    group.add(marker);

    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(landmark.radius, 0.12, 8, 36),
      new THREE.MeshStandardMaterial({
        color: landmark.color,
        emissive: landmark.color,
        emissiveIntensity: 0.35,
      }),
    );
    ring.position.copy(landmark.position).add(new THREE.Vector3(0, 0.25, 0));
    ring.rotation.x = Math.PI / 2;
    group.add(ring);
  }

  return group;
}

function buildVillage(group: THREE.Group, landmark: Landmark): void {
  const plaza = new THREE.Mesh(
    new THREE.CylinderGeometry(9, 9, 0.35, 24),
    new THREE.MeshStandardMaterial({ color: '#c7b27d', roughness: 0.9 }),
  );
  plaza.position.copy(landmark.position).add(new THREE.Vector3(0, 0.1, 0));
  plaza.receiveShadow = true;
  group.add(plaza);

  const houseMaterial = new THREE.MeshStandardMaterial({ color: '#f1d59a', roughness: 0.78 });
  const roofMaterial = new THREE.MeshStandardMaterial({ color: '#d85c43', roughness: 0.74 });

  for (let i = 0; i < 6; i += 1) {
    const angle = (i / 6) * Math.PI * 2;
    const x = Math.cos(angle) * 13;
    const z = Math.sin(angle) * 13;
    const house = new THREE.Mesh(new THREE.BoxGeometry(4.8, 3.4, 4.8), houseMaterial);
    house.position.copy(landmark.position).add(new THREE.Vector3(x, 1.8, z));
    house.rotation.y = -angle;
    house.castShadow = true;
    house.receiveShadow = true;
    group.add(house);

    const roof = new THREE.Mesh(new THREE.ConeGeometry(3.9, 2.4, 4), roofMaterial);
    roof.position.copy(house.position).add(new THREE.Vector3(0, 2.9, 0));
    roof.rotation.y = Math.PI / 4 - angle;
    roof.castShadow = true;
    group.add(roof);
  }
}
