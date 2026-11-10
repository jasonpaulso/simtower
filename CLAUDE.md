# SimTower JS

Browser port of the Windows 3.x SimTower executable: plain JavaScript ES modules on Canvas 2D,
no npm dependencies, no bundler. Behavior is recovered from the original executable, so fidelity
to it outranks cleanup or "improvement".

## Commands

```sh
npm run dev            # dev server on http://localhost:5173 (loopback only)
npm test               # node --test tests/*.test.mjs — no browser or original EXE needed
npm run build          # static site in dist/; BASE_PATH=/prefix/ rebases URLs for a sub-path
npm run deploy:local   # deploy to deploy.local and re-point the Tailscale mount
```

Requires Node 22+. `npm run extract` regenerates assets and needs Python 3, Pillow and a local
`SimTowerDOS/SIMTOWER.EXE`; it is rarely needed because runtime assets are tracked.

## Layout

- `src/` — simulation, renderer and browser UI. `original-*.js` modules each mirror one recovered
  subsystem of the original game; `main.js` is the browser entry, `simulation.js` the model.
- `public/assets/` — original and waifu2x-upscaled resources, served at `/assets/`.
- `tests/` — model and save/load regressions. Browser entry modules are not imported by tests;
  `npm run build` syntax-checks them instead.
- `tools/` — dev server, build, asset extraction scripts.
- `research/` — source audits and `MANUAL_COVERAGE.md`, the checklist of covered behavior, known
  gaps and deliberate browser adaptations. Check it before changing game behavior.

## Conventions

- Source uses absolute URLs (`/assets/…`, `/src/…`, `/style.css`). Don't make them relative;
  `tools/build-base.mjs` rewrites them at build time for sub-path hosting.
- `tools/server.mjs` only serves `index.html`, `style.css`, `src/` and `assets/`. A new top-level
  runtime file needs adding to its allowlist and to `tools/build.mjs`.
- Keep the project dependency-free.
- `SimTowerDOS/`, IDA files, raw dumps and native saves are private inputs and gitignored. Never
  commit them.

## Deployment

Three targets, all from the same source:

- **GitHub Pages** — `.github/workflows/pages.yml` tests and publishes `main` with
  `BASE_PATH=/<repo>/`.
- **deploy.local** — `deploy.yaml` plus `Dockerfile`. The server requires both; it does not
  auto-detect Node projects. The container runs `tools/server.mjs` on port 5173 with
  `HOST=0.0.0.0`. On the Mac Studio the app is at `https://simtower.local:8443` (Tailscale holds
  port 443, so the CLI's printed URL without a port is wrong there).
- **Tailscale Serve** — mounted at `/simtower` on the machine's tailnet hostname. The image
  carries a second build with `BASE_PATH=/simtower/` in `dist/`, which `server.mjs` serves under
  that prefix when `BASE_PATH` is set. deploy.local publishes the container on a random loopback
  port per deploy, so `tools/tailscale-serve.sh` must run after every deploy to re-point the
  mount; `npm run deploy:local` does both.

If a deploy shows `failed`, the reason is only in
`deploy.local/.deploy-data/build-logs/<id>.log` on the server.
