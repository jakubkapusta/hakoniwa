# Hakoniwa — notes for agents

A relaxing browser toy (phone portrait first, laptop too): assemble Japanese cardboard dioramas piece by piece; after the last piece the scene turns to evening and comes alive. Vite + TypeScript + three.js, **no image/audio files** — every texture is painted on canvas at runtime, every sound synthesized (owner's decision: procedural only). Design doc: `docs/PLAN.md` (Polish, source of truth for milestones). Deployed to GitHub Pages from `dist/` by `.github/workflows/pages.yml`. Pattern projects: `~/code/roj`, `~/code/fala`, `~/code/puls` — copy from there, don't import.

## Status (read first)

- **M1 done, M2 done 2026-10-12** (owner accepted the anime style "w miarę" and asked for a shelf with atmosphere): 3D shelf room, three scenes (Yatai, Przystanek w deszczu, Kapliczka Inari), the `nowa-scenka` skill (`.claude/skills/nowa-scenka/SKILL.md`) for adding scenes. **M3 in progress (2026-10-12):** three more scenes — Łaźnia zimą (`sento.ts`: snow, chimney steam), Letni festiwal (`matsuri.ts`: goldfish, lantern strings, taiko, fireworks), Stacyjka nad morzem (`eki.ts`: animated sea, lighthouse beam, level crossing, a train). **2026-10-13:** owner said a dozen-odd pieces go too fast, so the new scenes are bigger: 32 pieces in 8 steps each — Herbaciarnia w ogrodzie (`chaya.ts`: koi pond, arched bridge, waterfall, shishi-odoshi, wisteria arbour, fireflies) and Wiejska zagroda (`satoyama.ts`: thatched minka, water wheel, rice paddies, the moon rising at dusk). Then two more of that size: Uliczka z barami (`yokocho.ts`: a row of bars under a viaduct, lightboxes, neon, a yakitori stall, a train crossing the viaduct) and Świątynia w Nowy Rok (`hatsumode.ts`: main hall, a pagoda stacked tier by tier, a bell tower whose log strikes the bell, snow). The tray shrinks cards to fit up to 5 per step on a phone (piece names must fit ~53 px at 11 px bold — one word, or break at a space/hyphen). Waiting for the owner's test. Still open in M3: punch-out / master mode / decorative choices, street of dioramas.
- Owner decisions: hybrid of steps (layers, back to front) and pieces (drag onto a ghost outline, or tap to auto-place); procedural graphics only; extras in M1 = layered sound + secret. Later candidates: punch-out from the sheet, master mode (no ghosts), decorative choices, a street of finished dioramas.
- Local preview: `.claude/launch.json` lives one level up in `~/code` (`hakoniwa` → port 5221 dev, `hakoniwa-dist` → 4221 preview).

## Commands

```bash
npm run dev          # vite --host
npx tsc --noEmit     # typecheck after every change
npm run build        # typecheck + static build
npm run icons        # regenerate PWA icons (scripts/icons.mjs)
```

URL hash `#auto` shows a "▶ Auto" button that assembles the open scene. Dev helper `window.__hk`: `open('<scene id>')`, `auto()`, `session`, `stage`, `step(sec)` (advances the game by hand — the browser pane is shared with the owner, so test in a background tab via `tabs_create`, where animation frames don't run: `__hk.auto(); await __hk.step(10)`; remove `#fade`/`#final` `.show` by hand there). Progress lives in `localStorage['hakoniwa.v1']` — edit it to jump to a state (e.g. all pieces but one placed).

## Code map

- World units, **y up**, the camera looks from the front (+z). A base board is 6.4 × 5 (x ±3.2, z ±2.5), its top at y = 0; the back edge (z ≈ −2.4) holds the backdrop cutouts.
- `src/core/paint.ts` — canvas painters: `wash`, `blob`, `mottle`, `grass`, `clumps`, `wood`, `text` (upright in both conventions, vertical Japanese with turned `ー`), shape helpers (`circ`, `poly`, `rrect`, `polarPts`, `bandPts`) that trace on any `Pen` (a `THREE.Shape` or a canvas), `paintSky`.
- `src/kit/kit.ts` — the cardboard kit. All materials are `MeshToonMaterial` (cel shading, 4-step gradient map) via `toon()` / `plain()` / `paperMat()`; roughness/metalness options are ignored. `cutoutAsset(key, outline, paint)` = outline extruded to board thickness, printed with the same outline (**y up**, world units), optional `emissive` painter → glow map, thin ink contour. `boardMat(key, W, H, paint)` = print for a box face (**y down**, canvas top = hinge / back edge). `foldBox` (lid + 4 flaps), `wallNet` (3 walls, vertical hinges), `gableRoof` (2 boards at a ridge): `userData.setFold(0..1)` (0 = flat net). Everything is memoized by key (`memo`) — keys must be unique per scene (`K('…')` prefix).
- `src/kit/base.ts` — the base slab (printed top + soil sides).
- `src/scenes/types.ts` — `SceneDef`: pieces (`pos`, `rotY`, `build`, optional ambient `sound`), steps, sky palettes, light keys (day/evening incl. bloom), base painter, `secret`, `setup(ctx)` → hooks `placed`, `finale`, `alive` (opened already finished), `update(dt, t, ctx)`; `ctx.evening` 0..1, `ctx.sound(layer, level)`, `ctx.fx`. Pieces animate via `userData.tick(t, evening)`.
- `src/scenes/yatai.ts`, `przystanek.ts`, `inari.ts`, `sento.ts`, `matsuri.ts`, `eki.ts`, `chaya.ts`, `satoyama.ts`, `yokocho.ts`, `hatsumode.ts` — the scenes; `src/kit/people.ts` — shared figure outlines and faces for new scenes; `index.ts` lists them for the shelf. To add one, follow the `nowa-scenka` skill.
- `src/game/session.ts` — one open scene: thumbnails (top view for flat pieces), step tray, ghosts, drag (the piece hangs just above the finger at its target's depth, so it shows from the first move; near the outline it is pulled in like a magnet and snaps on release; a plain tap only wiggles the card — owner: tap-to-place was too easy; `tapPlace` is kept for `#auto`), placing animation (fly → fold → drop → squash + puff + tok), step chime, finale (evening, autorotate, secret appears), secret tap (raycast or ≤ 34 px on screen), evening toggle.
- `src/game/fx.ts` — sprites: puff, sparkle, steam, petals, fireflies, ripples; `Rain` (line segments, `cover` area stays dry, ripples on puddles); emitters with a `rate`.
- `src/stage/stage.ts` — renderer, painted sky as a camera-attached plane (day/evening crossfade), hemi + sun lerped by evening, EffectComposer: render (MSAA + depth texture) → `InkPass` (`inkpass.ts`: scrubs NaN/Inf, then anime ink lines from depth jumps) → UnrealBloom (only emissive things should cross the threshold) → output; framing (`fit`), auto quality drop. `Snapshot` = small second WebGL context for card thumbnails and box art.
- `src/audio/audio.ts` — sfx (pick, fold, tok, chime, finale in the D yo-scale, secret, boom, bamboo knock, temple bell `kane`) and `Ambience` layers (town, leaves, chime/furin, bubble, crickets, frogs & a far temple bell louder in the evening, rain, hum, crow, engine, stream, birds, water wheel, grill sizzle, train over rail joints, …).
- `src/ui/shelf.ts` — `ShelfView`, the start screen: a 3D Japanese room (`room.ts`: plaster wall with a kakejiku, tatami, wooden shelf, an invisible shoji lattice that throws sunlight shadows, paper lamp, maneki-neko/plant/teapot/books for empty slots). Unfinished kits stand as boxes whose cover is the finished diorama (rendered once via `Snapshot.shootCanvas`); finished ones stand as **live mini dioramas** (their `setup` runs with a scaled group as `ctx.scene`, `alive` hook, ticks and fx). 1 column when the phone is upright (scroll by dragging), 2 otherwise. Day/evening follows the clock (18–6 evening), toggle button. Tap a box or its label → the camera flies in, fade (`#fade`), the session opens. Stage: `autoFrame = false` while the shelf owns the camera (OrbitControls not updated: it would clamp the angle), `hideSky()`, `shadowBox()`.

## Art direction (owner, 2026-10-12)

Anime / Ghibli look, procedural only. Flat tones with crisp edges, not noise: `foliage` (layered puffs: shade → mid → light → highlights, lit from the upper left), `tufts`/`meadow` for grass, cel-shaded cumulus in `paintSky` (shadow silhouette, lit body shifted up-left, bright crowns, flat bottom). Props and characters get a dark ink contour (`cutoutAsset` ink); backgrounds (hills, forest, town) get none, like painted Ghibli backgrounds. Keep paper grain subtle. Day bloom stays tiny (it hazes the sky).

## Rules that bite

- **Never put a light exactly on a surface** (distance 0 → NaN on mobile GPUs → white flashes over the whole screen through bloom; the bus headlight did this). `InkPass` scrubs NaN/Inf as a safety net.

- Emissive materials: intensity × the glow map must stay modest or bloom turns them into white blobs (the vending machine needed ~0.55). Tune at evening.
- Dragging listens on `window` (move/up/cancel by `pointerId`), not on the card: on the owner's phone the release sometimes never reached the (hidden) card, the drag stayed open and the piece hung in the air with everything blocked (2026-10-13). A new touch or window blur finishes a drag whose release got lost. Tweens and the scene's `update` hook are wrapped in try/catch so one error can't freeze every frame.
- Hidden UI must not catch taps: `.screen` uses `visibility: hidden` when not `.show`.
- Something in the back is easily hidden by things in front from the default camera (the chef had to move beside the cart; the bus can't park in front of the shelter, so it comes and goes).
- Vehicles (bus, train) are clipped to the base with `clippingPlanes` (`renderer.localClippingEnabled = true`); the planes are world-space, so they're re-derived from `ctx.scene.matrixWorld` every frame (the shelf shows scaled copies).
- Shelf miniatures: `ctx.quiet` is true — no one-shot sounds, and effects that would leave the cubby (fireworks, the lighthouse beam) stay off. Point lights inside a miniature get `distance × SCALE` once and `intensity × SCALE²` every frame (hooks set absolute intensities each frame — keep it that way).
- Browser pane mobile emulation shows black bands at the right/bottom edge in screenshots; it's the pane, not the game.
- The browser pane is shared with the owner — unexpected state (muted sound, a found secret) may be their clicks.

## Verifying

Typecheck, build, then look at it in the browser at 375×812 and in a wide window; run `#auto` through a scene to see the finale. Commit messages are in Polish. After `git push` don't wait for the Pages deploy.
