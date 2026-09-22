# Boi-Boian

Neo-street court sports for the [404 Game Jam](https://game.404.xyz/). Authentic Boi-boian rules, Knockout City energy, built with **Vite + React + Three.js**. All 3D is code (404 recipe) — no downloaded meshes.

## Play

```bash
npm install
npm run dev
```

Build for static host:

```bash
npm run build
npm run preview
```

Deploy the `dist/` folder (GitHub Pages, etc.). Paths are relative (`base: './'`).

## Jam hooks

- `window.__READY__` when loaded
- `window.__START__()` begins a teal (rebuild) match
- `window.__GAME__` each frame: `pos`, `fps`, `draws`, `tris`, …

## Controls

| | Desktop | Touch |
|---|---|---|
| Move | WASD | Virtual stick |
| Aim | Mouse | Face move / aim |
| Throw | Hold LMB | Hold THROW |
| Pass | RMB / Q | PASS |
| Pick / Place | E | PLACE |
| Swap body | Tab / F | SWAP |
| Boi | Space | BOI |

## Stack

- Vite 6 + React 19
- Three.js 0.169
- 404 harness: `assetlib`, `surfaces`, `rig`
- Web Audio SFX (no asset files required)

## Style

See `style-lock.md` — **Knockout Court**: teal vs mango vinyl athletes, dusk dual-temp lighting, ceramic pyramid, gloss rubber ball.
