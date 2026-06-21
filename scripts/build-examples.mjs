// build-examples.mjs — validate mined real-world compositions against ground
// truth, keep only the clean+correct ones, write data/examples.json.
//
// A candidate example is ACCEPTED only if:
//   - it contains no custom CSS (no class= / style= anywhere),
//   - every <m3e-*> tag exists in the CEM,
//   - every attribute on an m3e element is documented (or a global like
//     slot/id/aria-*/data-*),
//   - every literal-union attribute value is a member of that union,
//   - every slot="x" targets a real slot on its nearest m3e ancestor.
// Rejections are reported with reasons (this doubles as a correctness probe).

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(fileURLToPath(import.meta.url), "../..");
const raw = JSON.parse(fs.readFileSync(path.join(ROOT, "data/examples_raw.json"), "utf8"));
const comps = JSON.parse(fs.readFileSync(path.join(ROOT, "data/components.json"), "utf8"));

// ground-truth index: tag -> { attrs:Map(name->type), props:Set, slots:Set }
const GT = new Map();
for (const c of comps)
  for (const e of c.elements)
    GT.set(e.tag, {
      attrs: new Map(e.attributes.map((a) => [a.name, a.type || ""])),
      props: new Set(e.properties.map((p) => p.name.toLowerCase())),
      slots: new Set(e.slots.map((s) => (s.name === "(default)" ? "" : s.name))),
    });

const GLOBAL_OK = (name) =>
  ["slot", "id", "role", "title", "hidden", "tabindex", "lang", "dir", "is"].includes(name) ||
  name.startsWith("aria-") ||
  name.startsWith("data-");
const NATIVE = new Set(["div","span","a","img","input","textarea","label","p","time","nav","main","section","header","footer","ul","ol","li","h1","h2","h3","h4","h5","h6","button","slot","br","hr","strong","em","small","i","b"]);
const VOID = new Set(["img", "input", "br", "hr", "source", "meta", "link"]);

// ---- minimal HTML tokenizer -> tree -------------------------------------
function parse(html) {
  const root = { tag: "#root", attrs: {}, children: [], parent: null };
  let cur = root;
  const re = /<\/?([a-zA-Z][\w-]*)((?:\s+[^<>]*?)?)\s*(\/?)>/g;
  let m;
  while ((m = re.exec(html))) {
    const [, tag, attrStr, selfClose] = m;
    if (m[0][1] === "/") {
      // close tag — walk up to matching
      let n = cur;
      while (n && n.tag !== tag) n = n.parent;
      if (n && n.parent) cur = n.parent;
      continue;
    }
    const attrs = {};
    const ar = /([:\w-]+)(?:=("[^"]*"|'[^']*'|[^\s>]+))?/g;
    let a;
    while ((a = ar.exec(attrStr))) {
      const val = a[2] ? a[2].replace(/^["']|["']$/g, "") : "";
      attrs[a[1]] = val;
    }
    const node = { tag, attrs, children: [], parent: cur };
    cur.children.push(node);
    if (!selfClose && !VOID.has(tag.toLowerCase())) cur = node;
  }
  return root;
}

function nearestM3eAncestor(node) {
  let n = node.parent;
  while (n && !n.tag.startsWith("m3e-")) n = n.parent;
  return n && n.tag.startsWith("m3e-") ? n : null;
}

/** all literals quoted & no bare string/number/boolean => closed union we can check */
function closedUnion(type) {
  if (!type || !type.includes("|")) return null;
  const parts = type.split("|").map((s) => s.trim());
  if (parts.some((p) => /^(string|number|boolean|null|undefined)$/.test(p))) return null;
  const lits = parts.filter((p) => /^["'].*["']$/.test(p)).map((p) => p.replace(/^["']|["']$/g, ""));
  return lits.length === parts.length ? new Set(lits) : null;
}

function validate(ex) {
  const errs = [];
  if (/\b(class|style)=/.test(ex.code)) errs.push("contains custom CSS (class/style)");
  const root = parse(ex.code);
  const walk = (node) => {
    for (const child of node.children) {
      const t = child.tag;
      if (t.startsWith("m3e-")) {
        const gt = GT.get(t);
        if (!gt) {
          errs.push(`unknown tag <${t}>`);
        } else {
          for (const [an, av] of Object.entries(child.attrs)) {
            if (an === "class" || an === "style" || GLOBAL_OK(an)) continue;
            if (gt.attrs.has(an)) {
              const u = closedUnion(gt.attrs.get(an));
              if (u && av && !u.has(av)) errs.push(`<${t}> ${an}="${av}" not in ${gt.attrs.get(an)}`);
            } else if (!gt.props.has(an.replace(/-/g, ""))) {
              errs.push(`<${t}> has undocumented attribute "${an}"`);
            }
          }
        }
      } else if (!NATIVE.has(t.toLowerCase()) && t !== "#root") {
        errs.push(`non-standard tag <${t}>`);
      }
      // slot targeting
      if (child.attrs.slot != null) {
        const par = nearestM3eAncestor(child);
        if (par) {
          const pg = GT.get(par.tag);
          if (pg && !pg.slots.has(child.attrs.slot))
            errs.push(`slot="${child.attrs.slot}" not a slot of <${par.tag}>`);
        }
      }
      walk(child);
    }
  };
  walk(root);
  return [...new Set(errs)];
}

// ---- run -----------------------------------------------------------------
const accepted = {};
const report = [];
for (const ex of raw) {
  const errs = validate(ex);
  if (errs.length) {
    report.push({ ...ex, status: "REJECT", errs });
  } else {
    (accepted[ex.component] ||= []).push({ title: ex.title, code: ex.code, source: `${ex.project}: ${ex.sourceFile}` });
    report.push({ ...ex, status: "OK" });
  }
}

fs.writeFileSync(path.join(ROOT, "data/examples.json"), JSON.stringify(accepted, null, 2));

const ok = report.filter((r) => r.status === "OK").length;
console.log(`examples: ${ok}/${raw.length} accepted across ${Object.keys(accepted).length} components\n`);
for (const r of report)
  if (r.status === "REJECT") console.log(`✗ [${r.component}] ${r.title}\n    ${r.errs.join("\n    ")}`);
console.log("\nAccepted by component:", Object.fromEntries(Object.entries(accepted).map(([k, v]) => [k, v.length])));
