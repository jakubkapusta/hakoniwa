---
name: nowa-scenka
description: Add a new diorama scene (kit) to Hakoniwa — design brief, pieces, painters, finale, secret, verification. Use when the owner asks for a new scene ("dodaj scenkę", "nowa diorama", "kolejny zestaw").
---

# Adding a scene to Hakoniwa

A scene is one file in `src/scenes/` exporting a `SceneDef` (see `src/scenes/types.ts`), listed in `src/scenes/index.ts`. Everything is painted in code (owner's rule: procedural only, no image files). Read `CLAUDE.md` first (art direction, rules that bite). Use `yatai.ts`, `przystanek.ts`, `inari.ts` as templates — copy helpers, don't invent new mechanisms unless the scene needs them.

## 1. Brief (write it down before coding, in Polish, and show it to the owner if they asked to choose)

- **Place and season** — a cosy, everyday Japanese spot; each scene has its own season and light (spring = Yatai, rainy season = Przystanek, autumn = Inari; free: winter, summer festival, seaside, tea garden…). Own designs, nothing from Ghibli films.
- **Palette** — 4–5 main colours; day and evening sky palettes.
- **Steps (7–8)** back to front, like a kit manual: backdrop → water/ground → main building (floor, walls, roof, details) → paths → garden → props → people → animals. **About 30 pieces** (owner, 2026-10-13: a dozen-odd go too fast), 3–5 per step (5 is the most the tray fits on a phone). Build the main building from several pieces (floor, folding walls, roof, ridge, veranda). At least two fold-up pieces (`foldBox`, `wallNet`, `gableRoof`) per scene — folding is the signature moment. `chaya.ts` and `satoyama.ts` are the templates for this size.
- **Finale** — what comes alive at dusk: lights (emissive + point lights), one moving thing (bus, wisps, steam…), one particle mood (petals, leaves, rain, fireflies, snow).
- **Secret** — a small creature or object that appears after the finale, hidden from the default camera (behind something), findable by orbiting.
- **Ambience** — which `Layer` each piece switches on (`src/audio/audio.ts`; add a layer there if needed — synthesized only).

## 2. Build it

- World: base 6.4 × 5 (x ±3.2, z ±2.5), top at y = 0, camera from the front (+z). Backdrop cutouts at z ≈ −2.4, wide ±3.1.
- Keys: every `memo`/`cutoutAsset`/`boardMat` key prefixed with the scene id (`const K = (s) => 'myscene:' + s`).
- Cutouts: outline in world units, **y up**; the painter gets the same coordinates. Characters and props keep the default ink contour; backgrounds pass `ink: 0`. Thin shapes (grass blades, stems) read as dark sticks with ink — give them `ink: 0` or a solid clump outline. Fill the canopy colour before `foliage` so no gaps stay transparent. People: `figure`, `seatedOutline`, `face` from `src/kit/people.ts`.
- Boards (`boardMat`): world units, **y down** (canvas top = hinge / back edge).
- Paint with the anime brushes in `src/core/paint.ts`: `foliage`, `meadow`/`tufts`/`flowers`, `wash`, `blob`; flat tones with crisp edges, light from the upper left, little noise.
- Pieces: `{ name (Polish, short), pos, rotY?, build, sound? }`. Anything alive gets `userData.tick(t, evening)`.
- `setup(ctx)`: create point lights / emitters, return hooks `placed`, `finale`, `alive` (opened already finished — jump to the living state), `update` (drive emissive intensities and lights from `ctx.evening`). Hooks must also work when `ctx.scene` is a scaled group (the shelf shows a mini copy): add things to `ctx.scene`, never to a global scene; world-space things (clipping planes) must follow `ctx.scene.matrixWorld`.
- Add the scene to `SCENES` in `src/scenes/index.ts` and give it a `box` gradient and `seed`.

## 3. Rules that bite

- **Never put a light exactly on a surface** (NaN on mobile GPUs → white flashes).
- Emissive × glow map must stay modest at evening, or bloom turns it into a white blob. Tune with the evening on.
- Check occlusion from the default camera (front, slightly above): tall things in front hide things behind. Move pieces, don't fight the camera.
- Text in Polish must not depend on grammatical gender of the scene title (UI uses neutral phrasing).

## 4. Verify (do all of it)

1. `npx tsc --noEmit`, `npm run build`.
2. Dev server (`hakoniwa` in `~/code/.claude/launch.json`). The pane is shared with the owner, so open your own background tab (`tabs_create`) at `http://localhost:5221/#auto`; frames don't run there, drive them with `await __hk.step(sec)`. Fastest: write `localStorage['hakoniwa.v1']` with all pieces but the last placed, reload, `__hk.open('<id>')`, `__hk.auto(); await __hk.step(10)` for the finale.
3. Screenshot the finished scene by day and by evening (`__hk.session.toggleEvening()`), desktop and 375×812.
4. Drag one piece by hand (pointer events on a `.card`) — it must follow the finger and snap at its outline.
5. Find the secret by tapping it after the finale.
6. Back on the shelf: the box shows the cover, and a finished scene stands as a living mini diorama (no errors, lights, effects inside its slot).
7. Update `docs/PLAN.md` (scene list) and the status in `CLAUDE.md`; commit in Polish; push (don't wait for the deploy).
