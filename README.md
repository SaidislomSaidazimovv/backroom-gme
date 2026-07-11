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
    ├── backrooms-engine.js   3D simulation core (renderer, world, walker, game, loop)
    ├── models.js             First-person arm + flashlight, and the entity (+ rig loader)
    ├── settings.js           Reactive settings store (menu ⇄ engine), localStorage
    ├── textures.js           Procedural wall/carpet/ceiling maps
    ├── audio.js              Web Audio (hum, steps, whine, drone, breathing, heartbeat)
    ├── vhs.js                Noise canvas + tracking-bar sweep
    ├── osd.js                Battery / VHS clock / tape counter
    └── ui.js                 Loader gate, cursor, scroll reveals, whisper
public/models/entity.glb      The rigged entity (see Models below)
```

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
