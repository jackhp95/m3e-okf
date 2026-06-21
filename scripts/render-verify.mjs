// render-verify.mjs — load the actually-built @m3e/web bundle in a DOM and
// assert every custom-element tag the skill's examples use is really defined by
// the shipped code. This is a build-vs-examples cross-check the static CEM
// validation can't give: the CEM is generated from source by the analyzer, the
// bundle is compiled from source by rollup — this confirms the two agree on
// what elements exist, and that nothing an example references is tree-shaken or
// guarded out of `dist/all.js`.
//
// SCOPE — registration only, on purpose. Full runtime/render verification
// (constructing each element, running connectedCallback, checking it renders)
// requires a real browser: the form-associated components (switch, checkbox,
// radio, select, slider, …) call attachInternals() and use a CustomStateSet
// (`internals.states`), which jsdom does not implement — they throw on
// construction in any non-browser DOM. Mounting them under heavy no-op
// polyfills (stubbed Web Animations, matchMedia, constructable stylesheets)
// would test a fake environment, not the components. That belongs in a
// Playwright/Chromium harness, intentionally out of scope for this pipeline.
//
// Prereq: the upstream package must be built —
//   (cd .cache/m3e/packages/web && npm run build)   # produces dist/all.js
// Requires the jsdom devDependency. Not part of CI (CI stays browser-free and
// builds nothing from upstream).

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { JSDOM } from "jsdom";

const ROOT = path.resolve(fileURLToPath(import.meta.url), "../..");
const BUNDLE = path.join(ROOT, ".cache/m3e/packages/web/dist/all.js");

if (!fs.existsSync(BUNDLE)) {
  console.error(`✗ built bundle not found at ${path.relative(ROOT, BUNDLE)}`);
  console.error(`  build it first:  (cd .cache/m3e/packages/web && npm run build)`);
  process.exit(2);
}

// --- minimal DOM with the polyfills the bundle's module-eval needs ----------
// (constructable stylesheets, matchMedia, Resize/IntersectionObserver, CSS.supports,
//  Web Animations) — enough to *load and register*, not to faithfully render.
const dom = new JSDOM("<!DOCTYPE html><body></body>", { pretendToBeVisual: true, url: "http://localhost/" });
const W = dom.window;
if (W.CSSStyleSheet) {
  const P = W.CSSStyleSheet.prototype;
  if (!P.replaceSync) P.replaceSync = function (t) { this.__c = t; };
  if (!P.replace) P.replace = function (t) { this.__c = t; return Promise.resolve(this); };
}
for (const proto of ["Document", "ShadowRoot"]) {
  try {
    Object.defineProperty(W[proto].prototype, "adoptedStyleSheets", {
      get() { return this.__as || (this.__as = []); }, set(v) { this.__as = v; }, configurable: true,
    });
  } catch {}
}
W.matchMedia = W.matchMedia || (() => ({ matches: false, media: "", addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {}, dispatchEvent() { return false; } }));
W.ResizeObserver = W.ResizeObserver || class { observe() {} unobserve() {} disconnect() {} };
W.IntersectionObserver = W.IntersectionObserver || class { observe() {} unobserve() {} disconnect() {} takeRecords() { return []; } };
W.CSS = W.CSS || {};
if (!W.CSS.supports) W.CSS.supports = () => false;
const anim = { cancel() {}, finish() {}, play() {}, pause() {}, reverse() {}, finished: Promise.resolve(), onfinish: null, currentTime: 0, playState: "finished", effect: null, addEventListener() {}, removeEventListener() {} };
W.Element.prototype.animate = W.Element.prototype.animate || function () { return anim; };
W.Animation = W.Animation || class {};
for (const k of Object.getOwnPropertyNames(W)) { if (k in globalThis) continue; try { globalThis[k] = W[k]; } catch {} }
globalThis.window = W;
try { Object.defineProperty(globalThis, "navigator", { value: W.navigator, configurable: true }); } catch {}
for (const g of ["matchMedia", "ResizeObserver", "IntersectionObserver", "CSS"]) globalThis[g] = W[g];

// --- load the built bundle (registers every component) ----------------------
await import(pathToFileURL(BUNDLE).href);

// --- collect every m3e-* tag the skill's examples reference -----------------
const comps = JSON.parse(fs.readFileSync(path.join(ROOT, "data/components.json"), "utf8"));
const examples = JSON.parse(fs.readFileSync(path.join(ROOT, "data/examples.json"), "utf8"));
const TAG_RE = /<(m3e-[a-z0-9-]+)/g;
const usedTags = new Map(); // tag -> Set(source labels)
const note = (code, label) => {
  for (const m of code.matchAll(TAG_RE)) {
    const t = m[1];
    (usedTags.get(t) || usedTags.set(t, new Set()).get(t)).add(label);
  }
};
for (const c of comps) for (const ex of c.examples || []) note(ex.code, `${c.name} (README example)`);
for (const [name, list] of Object.entries(examples)) for (const ex of list) note(ex.code, `${name} (composition)`);

// --- assert each used tag is registered by the built code -------------------
const missing = [];
for (const [tag, sources] of [...usedTags].sort()) {
  if (!customElements.get(tag)) missing.push({ tag, sources: [...sources] });
}

const total = usedTags.size;
if (missing.length) {
  console.error(`✗ ${missing.length}/${total} example tag(s) are NOT defined by the built bundle:\n`);
  for (const m of missing) console.error(`  <${m.tag}>  — used in: ${m.sources.join(", ")}`);
  console.error(`\nEither the example references a tag the shipped code doesn't register, or the\nbuild is stale. (Note: README-example drift is separately withheld from cards;\nthis checks the markup that actually ships.)`);
  process.exit(1);
}
console.log(`✓ all ${total} distinct m3e-* tags used across examples are defined by the built bundle (dist/all.js).`);
