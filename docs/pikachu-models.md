# Pikachu Model Inventory

조사일: 2026-05-27

대상 저장소:

- GitHub organization: https://github.com/Pokemon-3D-api
- Assets repository: https://github.com/Pokemon-3D-api/assets
- Optimized model root: `models/opt`

이 문서는 `Pokemon-3D-api/assets` 저장소의 optimized GLB 파일 중 피카츄로 사용할 수 있는 후보를 정리한 것이다. 파일 탐색 기준은 다음과 같다.

- National Dex id `25`
- 파일명에 `pikachu`가 포함된 GLB
- 위치: `models/opt/<category>/*.glb`

## Summary

| Variant | Category | File | Size | Animation Count | Animation Names | Recommended Use |
|---|---:|---|---:|---:|---|---|
| Regular Pikachu | `regular` | `25.glb` | 146,152 bytes | 1 | `Impactrueno` | 기본 플레이어 캐릭터 |
| Shiny Pikachu | `shiny` | `25.glb` | 145,468 bytes | 1 | `Impactrueno` | 선택 가능한 색상 변형 |
| Alolan Pikachu | `alolan` | `25.glb` | 60,204 bytes | 0 | 없음 | 정적 모델/장식/추가 스킨 후보 |
| Gigantamax Pikachu | `gmax` | `25.glb` | 61,608 bytes | 0 | 없음 | 보스/거대화 이벤트 후보 |

## Model Details

### Regular Pikachu

- Category: `regular`
- File: `25.glb`
- URL: https://raw.githubusercontent.com/Pokemon-3D-api/assets/main/models/opt/regular/25.glb
- Animation count: `1`

Available animations:

| Name | Channels | Notes |
|---|---:|---|
| `Impactrueno` | 135 | 공격 애니메이션으로 사용. 이름은 Thunder Shock 계열 기술명으로 해석 가능 |

Current project mapping:

```text
Impactrueno -> attack
```

Idle, run, and jump clips are not present. The project should keep using procedural motion for those states unless another model source is added.

### Shiny Pikachu

- Category: `shiny`
- File: `25.glb`
- URL: https://raw.githubusercontent.com/Pokemon-3D-api/assets/main/models/opt/shiny/25.glb
- Animation count: `1`

Available animations:

| Name | Channels | Notes |
|---|---:|---|
| `Impactrueno` | 135 | Regular Pikachu와 같은 공격 액션으로 사용 가능 |

Recommended mapping:

```text
Impactrueno -> attack
```

This is a good candidate for a character selection option because it has the same action support as regular Pikachu.

### Alolan Pikachu

- Category: `alolan`
- File: `25.glb`
- URL: https://raw.githubusercontent.com/Pokemon-3D-api/assets/main/models/opt/alolan/25.glb
- Animation count: `0`

Available animations:

```text
None
```

Recommended use:

- Static character skin if procedural idle/run/jump/attack is acceptable.
- Non-player display model.
- Decoration or collectible preview.

### Gigantamax Pikachu

- Category: `gmax`
- File: `25.glb`
- URL: https://raw.githubusercontent.com/Pokemon-3D-api/assets/main/models/opt/gmax/25.glb
- Animation count: `0`

Available animations:

```text
None
```

Recommended use:

- Boss encounter.
- Temporary transformation.
- Large landmark/NPC rather than normal player character.

Because it has no embedded actions, use procedural motion or a separate animation source if it becomes playable.

## Current Recommendation

Use these as the first character options:

1. `regular/25.glb`
2. `shiny/25.glb`

Both include `Impactrueno`, so both can support the current attack action. The other two variants can be added later as static or procedural-only variants.

## Implementation Notes

Current project behavior:

- `F` or left click triggers `attack`.
- `Impactrueno` is mapped to `attack`.
- If a model has no idle/run/jump clips, the project does not loop the first animation as idle.
- Procedural bobbing is used for idle/run feel.

This is important because `regular/25.glb` only has one animation. If that single clip is treated as idle, Pikachu repeats the attack-like jump/electric motion forever.

## Inspection Command

The project contains a helper script:

```powershell
node scripts\inspect-pikachu-models.mjs
```

It queries the GitHub contents API, finds Pikachu candidate GLB files, and extracts animation names from each GLB JSON chunk.

