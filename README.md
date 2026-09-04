# nawafbalmutairi.github.io

Personal portfolio of **Nawaf Almutairi** — data analysis, business
intelligence, and machine learning.

Live at <https://nawafbalmutairi.github.io>

## Design

The homepage is a Three.js experience: one fixed WebGL canvas behind the
content, with scroll position driving a sequence of scenes. Each scene encodes
something real rather than decorating the page — an embedding field, a
6→10→10→4 neural lattice, bars scaled from the published figures, the
water-quality model clusters ordered by R², the NVIDIA supply-chain graph, and
the DenseNet/ResNet comparison.

**All text lives in the DOM.** The canvas is `aria-hidden` and purely
decorative, so the site is fully readable without WebGL, without motion, and
without JavaScript running at all.

## Running locally

No build step, no dependencies. Serve the directory:

```bash
python -m http.server 8000
```

Then open <http://localhost:8000>.

## Tests

Dependency-free browser harnesses — open them after starting the server:

- <http://localhost:8000/tests/smoke.html> — scroll maths and device tiering
- <http://localhost:8000/tests/scenes.html> — all seven 3D scenes

Each page's title reads `ALL PASS` or `FAIL (n)`.

## Structure

```
index.html          content + import map
styles/             tokens · base · sections
src/
  main.js           bootstrap, scene registry, render loop
  stage.js          renderer, camera, desktop-only bloom
  scroll.js         scroll position -> scene progress
  scenes/           one module per scene
  shaders/          GLSL as JS template strings
  util/             capabilities · reduced motion · math
docs/superpowers/   design spec and implementation plan
```

Three.js is loaded from jsDelivr via an import map, pinned to 0.169.0.
