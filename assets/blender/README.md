# AFVAR hero — MARKET TERRAIN asset pipeline

Contract: `docs/utils/AFVAR-Market-Terrain-Green-Red-Black-README.md` (§4, §5, §6, §11).
The previous wheel/portal hero (`MarketCoreScene`, `public/afvar/hero/`) is retired.

## Status (honest)

- **Blender is not installed on the build machine.** No `AFVAR_MarketTerrain_Main.blend`
  and no Cycles renders exist. Nothing in this repo claims otherwise.
- The hero renders the in-repo procedural scene
  `src/modules/home/components/MarketTerrainScene.tsx` **live** (R3F, `lite` mode:
  render-on-demand, drawn only when `u` changes) via `HeroLive.tsx` — solid materials
  only (graphite plinths, dark-metal bodies, opaque green/red LED inserts, satin wicks;
  zero glass). The earlier pre-rendered JPEG frame film (~10 MB, ~450 MB decoded) and
  its posters were retired: the hero ships **no image assets**. Before the 3D chunk
  loads the hero shows its dark background; reduced motion renders one still frame.

## Timeline (single source: `src/modules/home/components/marketTerrainConfig.ts`)

One value `u ∈ [0, 1]` drives the whole scene.

| u | README beat / chapter | What happens |
|---|---|---|
| 0.000–0.025 | Beat 1 — the signal | green trace, red counter-trace, hero candle edge in low light |
| 0.025–0.055 | Beat 2 — first candlestick | the foreground green candle rises (body + wick) |
| 0.055–0.100 | Beat 3 — terrain emerges | lanes rise near → far; grid wakes; green path draws |
| 0.100–0.140 | Beat 4 — travel | low tracking shot down the corridor between lanes 0 and 1 |
| 0.140–0.170 | Beat 5 — signals connect | first cluster links draw; scanning light sweeps |
| 0.170–0.200 | Beat 6 — wide reveal | pull back to the hero composition (establish, u = 0.2; the reduced-motion still) |
| 0.20–0.36 | Ch. A+B landscape | near/mid/far layers read; green/red contrast |
| 0.36–0.56 | Ch. C fly-through | low pass between the largest structures |
| 0.56–0.72 | Ch. D connections | more links; second scanner sweep |
| 0.72–0.88 | Ch. E wide reveal | highest, widest view of the complete terrain |
| 0.88–1.00 | Ch. F release | scene dims 60%, hands off to `#080A0B` content |

The web player auto-plays u 0 → 0.2 in 4.8 s, then scroll scrubs 0.2 → 1.

## Blender path (when Blender is available)

1. Create `assets/blender/AFVAR_MarketTerrain_Main.blend` with the collections from
   README §4.2 (`01_MARKET_TERRAIN_FOREGROUND` … `10_RENDER_HELPERS`).
2. Block the terrain from `marketTerrainConfig.ts`: `TERRAIN` (lanes, pitch, laneGap,
   widths, amplitudes, gap rule), `SEED` + the random walk in `MarketTerrainScene.tsx`
   (`buildTerrain`) for exact candle heights, `PATHS` (lane curves + links), `SCAN`.
   Scene units match 1:1.
3. Keyframe two cameras (16:9 and 3:4) from `CAMERA_KEYS` / `CAMERA_KEYS_MOBILE`
   (position + look target at each `at`), markers per the table above. Animate the
   reveal waves (`REVEAL`), path draws, scanner sweeps and the release dim.
4. Materials: brushed graphite / dark metal bodies, opaque green/red emissive inserts,
   satin steel wicks, matte etched graphite plane. **No glass, no transmission.**
   Lighting per README §4.5 (soft key, green/red rims, neutral fill, AO).
5. Eevee previews → Cycles finals, modest motion blur, bloom only on the emitters.
   A Blender upgrade would mean exporting a baked glTF for the live scene (or bringing
   back a frame player).
