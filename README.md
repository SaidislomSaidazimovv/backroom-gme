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
    ├── textures.js           Procedural wall/carpet/ceiling maps
    ├── audio.js              Web Audio (hum, footsteps, exit whine, drone, sfx)
    ├── vhs.js                Noise canvas + tracking-bar sweep
    ├── osd.js                Battery / VHS clock / tape counter
    └── ui.js                 Loader gate, cursor, scroll reveals, whisper
```

The React components render the exact DOM `id`/`class` contract the engine binds
to; the engine wires all behavior imperatively via those ids. Keep them in sync.

## Notes

- **Three.js is pinned to `0.128.0`** to match the original CDN r128 API
  (`outputEncoding`, `sRGBEncoding`, `ACESFilmicToneMapping`). Do not bump it
  without updating those calls.
- `StrictMode` is intentionally omitted in `main.jsx` — the engine is imperative
  and its dev double-mount would start the render loop twice.
