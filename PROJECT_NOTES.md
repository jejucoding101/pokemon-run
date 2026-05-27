# Project Notes

## Goal

Build a Roblox-style 3D sandbox world game where the player explores a varied world, later choosing a monster-style main character model.

## Current Direction

- World style: Roblox-like 3D sandbox, not a full Minecraft-style voxel world yet.
- Runtime: Three.js + TypeScript + Vite.
- Current physics: terrain-height based movement and ground collision.
- Planned physics: Rapier for real colliders, slope handling, object collision, and interactable world objects.
- Asset direction: GLB/glTF for character and environment models.
- Pokemon note: real Pokemon models have copyright/IP risk. For public or commercial use, use original monster assets or CC0 creature packs instead.

## Implemented

- Seed-based procedural terrain.
- Rule-based biome layout.
- Biomes:
  - Starting meadow
  - Forest
  - Desert
  - Snow mountain
  - Canyon
  - Volcano
  - Sky island visual markers
- Landmarks:
  - Central village
  - Forest gate
  - Snow peak lookout
  - Desert ruin
  - Canyon bridge
  - Volcano arena
  - Sky portal
  - Cave mouth
- Third-person player controller:
  - WASD movement
  - Space jump
  - Shift sprint
  - Camera drag rotation
  - Mouse wheel zoom
- Default character test:
  - Pikachu GLB loaded from `Pokemon-3D-api/assets`
  - Draco decoding configured through Google's public Draco decoder CDN
  - Embedded animation clips are mapped when present
  - Procedural bob/attack motion is used as fallback
- HUD:
  - Current biome
  - Nearest landmark
  - Control hint
  - Biome legend

## Important Files

- `src/render/WorldApp.ts`: main scene, lighting, terrain, props, landmarks, HUD, render loop.
- `src/render/CameraRig.ts`: third-person camera orbit/follow behavior.
- `src/player/PlayerController.ts`: movement, jump, sprint, terrain-height grounding.
- `src/world/terrain.ts`: seed-based heightmap terrain generation.
- `src/world/biomes.ts`: biome definitions and world placement rules.
- `src/world/landmarks.ts`: landmark data and marker/village geometry.
- `src/world/props.ts`: biome props such as trees, cactus, and rocks.
- `src/world/random.ts`: deterministic noise helpers.
- `src/input/InputController.ts`: keyboard action mapping.

## Next Work

1. Add a character selection screen.
2. Add more Pokemon or monster character entries.
3. Normalize animation clip names per model.
4. Add Rapier physics for terrain/object colliders.
6. Move world content into JSON manifests:
   - terrain settings
   - biome rules
   - landmark definitions
   - spawn points
   - interactables
   - collider metadata
7. Add interactable landmarks and portals.
8. Add chunk or sector loading if the world grows.

## Asset Notes

Useful safer alternatives to actual Pokemon models:

- Quaternius Ultimate Monsters Pack
- GDevelop 3D Colorful Monsters
- FreePixel 3D assets
- Other CC0 or clearly licensed GLB/glTF creature packs

Use actual Pokemon models only for private local experiments unless proper rights are secured.
