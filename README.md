# THE BACKROOMS — TAPE 01 / 1996

A liminal found-footage web experience: an endless VHS-grade Level 0 with a
handheld flashlight walker, and a playable "find the exit" maze mode with a
patrolling entity. Built with **Vite + React** and **Three.js** (r128).

Migrated from a single `backrooms.html` file to a structured React project with
the imperative WebGL/audio engine kept in framework-agnostic modules.

## Run

```bash
npm install
npm run dev      # start the dev server (http://localhost:5173)
npm run build    # production build → dist/
npm run preview  # serve the production build locally
```

## Controls

- **Scroll** — descend through the story sections.
- **PLAY** (loader) — start the ambient hum + reveal the scene.
- **F** or **TORCH** button — toggle the flashlight. **HUM** button — toggle sound.
- **NOCLIP** — fall through the floor.
- **PLAY — ENTER THE MAZE** — start the game: `WASD` move · mouse / drag look ·
  `Shift` run · `F` torch · follow the whine to the exit · keep the light on the
  entity to freeze it. Touch: left half moves, right half looks.

## Structure

```
index.html                    Vite entry (fonts + #root)
src/
├── main.jsx                  React root (StrictMode intentionally omitted)
├── App.jsx                   Composes the DOM + canvas, mounts the engine
├── styles/index.css          All styles (from the original <style>)
├── hooks/useBackroomsEngine.js
├── components/               Static JSX chrome + content sections
│   ├── VhsOverlays, WrongLevel, GameHud, GameEnd, Cursor, Loader, Chrome
│   └── content/{Hero,Level0,Tapes,Entity,Noclip,PlaySec,Footer}
└── engine/                   Framework-agnostic engine
    ├── backrooms-engine.js   Simulation core (renderer, walker, game loop, entity AI)
    ├── world.js              Level 0 itself — wall maze, drop ceiling, fluorescents
    ├── models.js             First-person arm + flashlight, and the entity (+ rig loader)
    ├── settings.js           Reactive settings store (menu ⇄ engine), localStorage
    ├── textures.js           Wallpaper / carpet / ceiling maps
    ├── audio.js              Web Audio (hum, steps, whine, breathing, heartbeat, scream)
    ├── vhs.js                Noise canvas + tracking-bar sweep
    ├── osd.js                Battery / VHS clock / tape counter
    └── ui.js                 Loader gate, cursor, scroll reveals, whisper
public/models/entity.glb      The rigged entity (see Models below)
```

## Level 0

`world.js` builds the level to the canon rather than to a convenient pillar field:

- **A maze of walls**, not scattered columns — randomly segmented rooms opening
  into tight one-cell hallways, punched through with doorways. "The architecture
  is entirely chaotic … there is absolutely no structural logic to the building."
- **Mono-yellow wallpaper** with a damask motif, paper seams, water damage and
  mould, over **damp brown office carpet**, under a **suspended acoustic ceiling**
  on a T-bar grid.
- **The lights are on.** Fluorescent troffers are inconsistently placed but lit,
  buzzing at "maximum hum-buzz" — Level 0 is a *bright*, sickly yellow space, not
  a dark one. A few tubes are dead or flickering, and rare blocks are the canon
  **pitch-black hallways** — which is where the torch still earns its keep.

The world is infinite and **deterministic**: every wall, fixture and dead tube is
a pure function of its grid coordinate, so nothing is ever stored. Walls are drawn
as `InstancedMesh` pools that are re-addressed whenever you cross a cell, and eight
real point lights are handed to the nearest live fixtures.

Sources: the [Backrooms Wiki](https://backrooms-wiki.wikidot.com/archived:level-0)
and the [Kane Pixels wiki](https://kane-pixels-backrooms.fandom.com/wiki/Common_Backrooms).

## Models

- **The arm + flashlight** is built procedurally in `models.js`: organic capsule
  geometry with real finger joints, plus canvas-generated skin / metal PBR maps
  (albedo + bump). It bobs with your gait and sways as you breathe.
- **The entity** is a rigged human (`public/models/entity.glb` — `Soldier.glb`
  from the [three.js examples](https://github.com/mrdoob/three.js), Mixamo rig),
  loaded with `GLTFLoader`. Its materials are overridden with a dark, damp flesh
  shader so it reads as a gaunt humanoid rather than a soldier, it's stretched
  tall and thin, and its **Idle / Walk / Run** clips are blended by how it's
  hunting you — frozen in your beam it plays *Idle*, stalking from afar *Walk*,
  closing in *Run*. The glowing grin + eyes are pinned to its head bone.

**Swapping the entity model:** drop any rigged `.glb` at `public/models/entity.glb`.
It works best with a Mixamo-style rig (a `mixamorigHead` bone and clips named
`Idle`, `Walk`, `Run`). If the file is missing or fails to load, the engine falls
back to a fully procedural entity built from capsules — the game still runs.

The React components render the exact DOM `id`/`class` contract the engine binds
to; the engine wires all behavior imperatively via those ids. Keep them in sync.

## Notes

- **Three.js is pinned to `0.128.0`** to match the original CDN r128 API
  (`outputEncoding`, `sRGBEncoding`, `ACESFilmicToneMapping`). Do not bump it
  without updating those calls.
- `StrictMode` is intentionally omitted in `main.jsx` — the engine is imperative
  and its dev double-mount would start the render loop twice.
