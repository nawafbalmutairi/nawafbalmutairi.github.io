# nawafbalmutairi.github.io

Personal portfolio of **Nawaf Almutairi** — data analysis, business
intelligence, and machine learning.

Live at <https://nawafbalmutairi.github.io>

## Design

A spatial environment rather than a page. One photographic-style environment
plate sits behind everything; content lives on translucent panels arranged
across four depth planes (environment, far, mid, near) with the nav rail and
contact dock floating nearest the camera. Five destinations — Identity, Work,
Stack, Journey, Contact — replace scrolling sections.

Built with DOM and CSS only: `backdrop-filter`, layered box-shadows and
transforms. There is no WebGL and no 3D library, because nothing here needs
real geometry — the water-quality result is twenty numbers, and twenty numbers
render better as a table than as a mesh.

## Structure

```
index.html      shell + noscript fallback
content/        SINGLE SOURCE OF TRUTH — every fact, figure and link,
                each cited in a comment to the file it was read from
spatial/        the Panel primitive, depth system, pointer parallax,
                environment loader, and the material tokens
ui/             typography, composition, and the renderer
fonts/          Instrument Sans, self-hosted (SIL OFL 1.1)
assets/         environment plate, generated procedurally
docs/           design spec and implementation plan
```

Content is data. No copy is written in the renderer; adding a project means
editing `content/work.js` and nothing else.

## Running locally

No build step, no dependencies:

```bash
python -m http.server 8000
```

## Measured

Lighthouse mobile 100/100/100/100 · JS 16.1KB gzipped · environment plate
19.8KB at 2560x1440 · text contrast minimum 5.14:1 measured against the
composited backdrop across 169 text runs.
