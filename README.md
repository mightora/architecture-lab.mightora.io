# Mightora Architecture Lab

A free static solution architecture diagram gallery and playground. All eight engines are served from the same site; there is no diagram-rendering backend.

## Included

89 editable examples across PlantUML, Mermaid, Graphviz/Viz.js, D2, Vega-Lite, WaveDrom, BPMN/bpmn-js and diagrams.net. A diagram-type guide explains purposes and use cases. Platform home pages, documentation, creators and licence information are credited.

Source editing / live preview, BPMN and diagrams.net visual editing, import, browser-local saving, compressed snapshot share links, font selection and PNG resolution controls.

Exports: native editable DOCX and PPTX, SVG, PNG, original platform source, portable project JSON, standalone HTML and browser Print/PDF.

## Run and deploy

```sh
npm ci
npm run build
```

Serve `dist/` from any static HTTPS host. Vite bundles the app and selected dependencies. `public/vendor/` contains pinned copies of PlantUML, D2, WaveDrom and the self-hosted diagrams.net editor. `package-lock.json` fixes npm versions.

To refresh the three npm-vendored engines and licence notices after a deliberate dependency upgrade:

```sh
node scripts/vendor.mjs
```

The diagrams.net static editor was obtained from `jgraph/drawio` commit `9034053fba80a435e27d68d374bc564b83917ae9` and copied from `src/main/webapp/`, excluding server directories and source maps. Its source licence and README are retained in `public/vendor/drawio/`. Do not substitute its branding for Mightora’s branding.

## Contribute an example

Add an entry to `src/catalogue.js` with a stable ID, a known platform ID, diagram family, title, purpose, source and optional scenario / level. Keep it self-contained. Avoid real customer data. Explain whether measurements are fictional. Every entry appears automatically in the gallery and platform dropdown.

## Editable Office exports

`src/svg-model.js` converts SVG geometry into an intermediate model with paths and text boxes. `src/office.js` serialises it as native DrawingML shapes and text. PowerPoint contains individually selectable objects; Word contains a native grouped drawing. Use desktop Office for editing the group / individual shapes.

This is not a lossless general SVG-to-Office converter. Bitmap images, external references, gradients, filters and unsupported masks are rejected rather than flattened. Some visual effects, clipping, rich HTML label formatting and complex SVG constructs are not equivalent in Office. Font availability and Office version can change layout. Office edits do not round-trip back into diagram source. A successful editable export has native objects, not a single raster or embedded SVG image.

All nine PlantUML examples also passed the official Java engine’s syntax-only check (validation only; Java is not used by the site). Browser integration and desktop Office visual QA still need to be run; no browser QA tool or Office renderer was available in the build environment. The build, Graphviz/D2 output, Vega-Lite compilation, Mermaid syntax, WaveDrom output, BPMN/draw.io XML and Office file structure can be checked with:

```sh
node scripts/check.mjs
node scripts/check-syntax.mjs
```

## Privacy and static hosting

Diagram source stays in the browser except when a visitor deliberately shares a URL containing it. Local saves use localStorage; they are per browser and can be cleared. Diagram assets are self-hosted. The prescribed Mightora header/footer assets, logo and author images use their shared upstream URLs. Text engines restrict remote includes / images / data; imported visual diagrams should be self-contained. The self-hosted diagrams.net editor uses offline embed mode with cloud integrations disabled.

Share URLs are snapshots, not persistent publishing records. Accounts, shared storage and live collaboration would require a separate backend.

## Attribution and licences

See `public/THIRD-PARTY-NOTICES.txt`, `public/vendor/` and the Credits section. PlantUML uses the official MIT browser package. Graphviz’s corresponding source is identified in Viz.js build provenance. D2 is MPL 2.0; the matching 0.1.34 source revision is recorded in `public/SOURCE-VERSIONS.json` and linked in Credits. Corresponding covered source must remain obtainable, including any modifications. bpmn-js's watermark is not removed or obscured. Draw.io’s code is Apache 2.0, with separate icon/stencil and trademark terms.

The Mightora UI follows the design-system instructions from `mightora/radar.mightora.io`, including the full brand logo, shared components, footer YAML repair and creator biography.

## Renderer loading and enterprise views

Runtime renderer imports are resolved against the document base URL before dynamic import. This prevents Vite chunks under `/assets/` from looking for PlantUML and D2 under the nonexistent `/assets/vendor/` path. `node scripts/check-renderer-assets.mjs` covers root and subfolder hosting.

The site explains why diagrams as code can help with review, version history, repeatable rendering, reuse and delivery checks, with a balanced note about accuracy and visual editing.

Four enterprise examples cover business/application/technology alignment, motivation, application cooperation and a D2 layer sketch. PlantUML examples use native `archimate` syntax with explicit type labels and no remote includes or optional sprite dependencies. These are illustrative views, with no metamodel validation or ArchiMate model exchange. The site credits The Open Group and links to the separate Archi desktop modelling tool.


## Everyday examples and export fixes

The gallery includes 12 Christmas dinner views and 12 family holiday views, with a scenario filter and quick story selectors. Edit `src/everyday-examples.js` to extend them. Budget figures and dates are fictional. Timing diagrams are coordination illustrations, not cooking instructions.

The Office export converter filters non-graphics SVG elements (including title, desc, metadata and style) before accessing SVG geometry APIs, and uses the installed path library's `normalizeHVZ(false,true,true)` method to normalise horizontal/vertical paths while retaining close commands. `node scripts/check-svg-export.mjs` exercises actual SVG conversion plus native DOCX/PPTX generation. Its jsdom geometry stubs test the export pipeline, not browser visual layout.

Every export leaves a persistent direct download link. On browsers that support file sharing, a separate Save / share button opens the system sheet from a fresh user gesture. The blob URL stays alive until another file is exported or the page is left.

## Scenario-first exploration

The default gallery starts with Christmas dinner. Six guided stories (five everyday scenarios plus the professional service request) have a shared brief, people, assumptions and question shortcuts. The three new collections—Birthday party, Moving house and Online order—each contain ten complementary views. All 89 examples remain available through scenario, diagram-type and platform filters.

`src/scenarios.js` owns the shared briefs, question/limitation guidance and pure filter function. `src/scenario-examples.js` uses one scenario definition to generate consistent context, process, sequence, lifecycle, plan, dependency, information, budget, BPMN and responsibility views. Do not change actor names or budget figures independently of the story brief.

The gallery and playground explain the question each view answers and what it leaves out. Optional direct story URLs use `?scenario=christmas-dinner`, `family-holiday`, `birthday-party`, `moving-house`, `online-order` or `service-request` before `#examples`.

`node scripts/check-scenarios.mjs` validates story coverage, starting views and combined filters. `node scripts/check-scenario-ui.mjs` executes the real UI handlers in jsdom with a stub renderer; it covers default selection, story switches, question shortcuts and type/platform filters. These tests do not verify browser layout or real browser rendering.

## GitHub Pages

Pushes to `main` build and deploy the static site with GitHub Actions. In repository Settings → Pages, select **GitHub Actions** as the source if GitHub does not enable it automatically. No backend or runtime credentials are required.

For a fresh local checkout, run `npm ci`, `bash scripts/prepare-vendor.sh`, then `npm run build`. The vendor preparation downloads the pinned diagrams.net source recorded in `public/SOURCE-VERSIONS.json` and retains its licence files.

## Markdown to Word

The document tool accepts GitHub-flavoured Markdown and diagram fences from all eight platforms, plus SVG. It generates real editable DOCX paragraphs, headings, native lists, tables and drawing groups. Supported fence aliases and limits are shown in the UI. Unsupported diagrams retain source and diagnostic text; raw HTML is text and images become alt-text placeholders. No remote diagram resources or document uploads are used. Source inclusion is optional for successfully converted diagrams. Single-backtick inline code remains ordinary text.

Run `node scripts/check-markdown.mjs` and `python3 scripts/check-markdown-office.py` for conversion and Word package checks. Browser integration and desktop Word visual QA remain separate checks.

Playground diagrams automatically fit both the width and height of the preview, including on browser resize. Zoom is relative to that fit; Fit restores the full diagram. Embedded BPMN and diagrams.net canvases use their native fit operations. `node scripts/check-preview-fit.mjs` checks sizing and interactions; browser visual QA remains separate.

The preview toolbar includes Full screen / Exit full screen. Escape restores the playground; browsers without native fullscreen use a viewport overlay. The diagram fits the expanded preview automatically. Mermaid uses global `htmlLabels: false` for native SVG text, while the sanitizer also preserves safe XHTML labels inside SVG foreignObject. Regression checks run the actual Mermaid flowchart, state and sequence renderers with simulated DOM measurements; browser visual checks remain separate.
