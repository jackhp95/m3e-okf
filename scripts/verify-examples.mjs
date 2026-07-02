// verify-examples.mjs — compile-verify generated Elm example expressions
// against the REAL M3e.* / Kit / Native API.
//
// "Examples can't lie": the deterministic mapper emits typed Elm, but nothing
// has actually type-checked it. This harness builds a scratch Elm *application*
// whose source-directories point at the real library sources, emits every
// example as a top-level binding (no annotation — inference does the work),
// runs `elm make ... --report=json` ONCE, and maps each failing binding back
// to its (module, idx, title). Callers use this to DROP non-compiling examples.
//
// Usage as a module:
//   import { verifyExamples } from "./verify-examples.mjs";
//   const { failures, ok } = verifyExamples(generated);
// Usage from CLI:
//   node scripts/verify-examples.mjs [config/examples.generated.json]
//   -> prints the failing (module, idx, title, firstErrorLine) set.

import { readFileSync, writeFileSync, mkdirSync, rmSync, existsSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { resolve } from "node:path";

const M3E_ROOT = "/Users/jack/Documents/code/elm-m3e";
const LIB_SRC = `${M3E_ROOT}/packages/m3e/src`;
const KIT_SRC = `${M3E_ROOT}/packages/m3e-kit/src`;
const ELM_BIN = `${M3E_ROOT}/docs/node_modules/.bin/elm`;
const SCRATCH = "/tmp/verify-examples";

// Exact dependency versions used by the docs application (which already builds
// against these library sources). A scratch application needs both direct and
// indirect dependency maps; the library modules only ever import elm/core,
// elm/html, elm/json, elm/virtual-dom, so the minimal set below is sufficient.
const DIRECT = {
  "elm/core": "1.0.5",
  "elm/html": "1.0.1",
  "elm/json": "1.1.4",
  "elm/virtual-dom": "1.0.5",
};
const INDIRECT = {
  "elm/time": "1.0.0",
};

/**
 * Scan an Elm expression for the qualified modules it references.
 * Matches `Foo.Bar.baz` (module part = `Foo.Bar`), for any dotted PascalCase
 * prefix immediately followed by `.` + a lowercase-initial identifier.
 * @returns {Set<string>}
 */
export function referencedModules(code) {
  const mods = new Set();
  const re = /\b([A-Z][A-Za-z0-9_]*(?:\.[A-Z][A-Za-z0-9_]*)*)\.[a-z]/g;
  let m;
  while ((m = re.exec(code)) !== null) {
    mods.add(m[1]);
  }
  return mods;
}

/** Safe, collision-free binding name for one example. */
function bindingName(module, idx) {
  return `e_${module.replace(/\./g, "_")}_${idx}`;
}

/**
 * Does a qualified module name resolve to a real source file under one of the
 * library source dirs (or is it a well-known stdlib module)? Non-resolving
 * modules must NOT be imported — a bad `import` aborts the whole compile before
 * type-checking, hiding all real errors. Instead we skip the import and let elm
 * report a per-usage naming error, which IS attributable to the one binding.
 */
const STDLIB_ROOTS = new Set(["Html", "Json", "VirtualDom", "Basics", "Dict", "Set", "List", "Maybe", "Result", "String", "Char", "Tuple", "Array"]);
const moduleFileCache = new Map();
function moduleResolves(mod) {
  if (moduleFileCache.has(mod)) return moduleFileCache.get(mod);
  const rel = mod.replace(/\./g, "/") + ".elm";
  const resolved =
    STDLIB_ROOTS.has(mod.split(".")[0]) ||
    existsSync(resolve(LIB_SRC, rel)) ||
    existsSync(resolve(KIT_SRC, rel));
  moduleFileCache.set(mod, resolved);
  return resolved;
}

/**
 * Flatten the generated config into a list of { module, idx, title, code }.
 * `idx` is the index within that module's examples array.
 */
export function flattenExamples(generated) {
  const items = [];
  for (const module of Object.keys(generated)) {
    const examples = generated[module].examples || [];
    examples.forEach((ex, idx) => {
      items.push({ module, idx, title: ex.title, code: ex.code });
    });
  }
  return items;
}

/** Build the scratch elm.json (type application) pointing at real sources. */
function writeScratch(items) {
  rmSync(SCRATCH, { recursive: true, force: true });
  mkdirSync(resolve(SCRATCH, "src"), { recursive: true });

  const elmJson = {
    type: "application",
    "source-directories": [LIB_SRC, KIT_SRC, "src"],
    "elm-version": "0.19.1",
    dependencies: { direct: DIRECT, indirect: INDIRECT },
    "test-dependencies": { direct: {}, indirect: {} },
  };
  writeFileSync(
    resolve(SCRATCH, "elm.json"),
    JSON.stringify(elmJson, null, 4) + "\n",
  );

  // Union of every referenced module across all examples -> one import each.
  // ONLY import modules that resolve to a real source file (or stdlib): a bad
  // `import` aborts the whole compile before type-checking, which would hide
  // every real error and falsely pass all bindings. A reference to a
  // non-existent module (e.g. mapper emitted `M3e.CircularProgressIndicator`
  // when the real module is `M3e.Progress`) is left un-imported, so elm reports
  // a "cannot find variable" naming error at the usage site — attributable to
  // that one binding, which then correctly fails.
  const imports = new Set();
  for (const it of items) {
    for (const mod of referencedModules(it.code)) {
      if (moduleResolves(mod)) imports.add(mod);
    }
  }

  const lines = [];
  lines.push("module Verify exposing (..)");
  lines.push("");
  for (const mod of [...imports].sort()) {
    lines.push(`import ${mod}`);
  }
  lines.push("");
  for (const it of items) {
    lines.push(`${bindingName(it.module, it.idx)} =`);
    // Indent the (possibly multi-line) expression by 4 spaces so it's a valid
    // definition body.
    const body = it.code
      .split("\n")
      .map((l) => "    " + l)
      .join("\n");
    lines.push(body);
    lines.push("");
  }
  writeFileSync(resolve(SCRATCH, "src", "Verify.elm"), lines.join("\n") + "\n");
}

/**
 * Run elm make and parse the JSON report. Returns a Map from binding name to
 * an array of { line, message } (first error line + rendered message).
 */
function compileAndCollectErrors() {
  let stdout = "";
  try {
    execFileSync(
      ELM_BIN,
      ["make", "src/Verify.elm", "--output=/dev/null", "--report=json"],
      { cwd: SCRATCH, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] },
    );
    return { report: null, byBinding: new Map() }; // clean compile
  } catch (err) {
    stdout = (err.stdout || "") + "";
    const stderr = (err.stderr || "") + "";
    let report;
    try {
      report = JSON.parse(stdout || stderr);
    } catch {
      // Not JSON -> something structural is wrong (bad elm.json, elm crashed).
      return {
        report: null,
        fatal: (stdout || stderr || String(err)).slice(0, 4000),
        byBinding: new Map(),
      };
    }
    return { report, byBinding: mapReportToBindings(report) };
  }
}

/** Render a `message` array (elm's rich chunks) into plain text. */
function renderMessage(message) {
  if (typeof message === "string") return message;
  if (!Array.isArray(message)) return String(message);
  return message
    .map((chunk) => (typeof chunk === "string" ? chunk : chunk.string || ""))
    .join("");
}

/**
 * Map an elm --report=json compile error report to bindings.
 * Two report shapes: { type:"compile-errors", errors:[...] } (type/name errors)
 * and { type:"error", ... } (single structural error, e.g. bad import/parse).
 */
function mapReportToBindings(report) {
  const byBinding = new Map();
  const src = readFileSync(resolve(SCRATCH, "src", "Verify.elm"), "utf8");
  const srcLines = src.split("\n");

  // Precompute binding start lines so we can attribute an error region (line
  // number) to the nearest preceding binding definition.
  const bindingAt = []; // [{ name, line }]
  srcLines.forEach((l, i) => {
    const m = /^([A-Za-z_][A-Za-z0-9_]*) =$/.exec(l);
    if (m) bindingAt.push({ name: m[1], line: i + 1 });
  });
  const bindingForLine = (line) => {
    let found = null;
    for (const b of bindingAt) {
      if (b.line <= line) found = b.name;
      else break;
    }
    return found;
  };

  const push = (name, entry) => {
    if (!name) name = "<unattributed>";
    if (!byBinding.has(name)) byBinding.set(name, []);
    byBinding.get(name).push(entry);
  };

  if (report.type === "compile-errors") {
    for (const fileErr of report.errors || []) {
      for (const problem of fileErr.problems || []) {
        const line = problem.region?.start?.line ?? 0;
        const name =
          bindingForLine(line) ??
          // fall back: some name errors reference the binding by name in text
          nameFromMessage(renderMessage(problem.message), bindingAt);
        push(name, { line, message: renderMessage(problem.message) });
      }
    }
  } else if (report.type === "error") {
    // Structural (single) error — e.g. a bad import. Not attributable to one
    // binding; surface as fatal-ish so the caller can decide.
    const line = report.region?.start?.line ?? 0;
    push(bindingForLine(line), {
      line,
      message: renderMessage(report.message),
      structural: true,
    });
  }
  return byBinding;
}

function nameFromMessage(text, bindingAt) {
  for (const b of bindingAt) {
    if (text.includes(b.name)) return b.name;
  }
  return null;
}

/**
 * ONE compile pass over `items` ({module,idx,title,code}[]). Returns the
 * per-item pass/fail split plus any errors elm couldn't attribute to a binding.
 */
function verifyOnce(items) {
  writeScratch(items);
  const { report, byBinding, fatal } = compileAndCollectErrors();
  if (fatal) return { fatal };

  const ok = [];
  const failures = [];
  for (const it of items) {
    const name = bindingName(it.module, it.idx);
    const errs = byBinding.get(name);
    if (errs && errs.length) {
      const first = errs[0];
      const firstErrorLine =
        renderMessage(first.message)
          .split("\n")
          .map((s) => s.trim())
          .find((s) => s.length > 0) || "compile error";
      failures.push({
        module: it.module,
        idx: it.idx,
        title: it.title,
        firstErrorLine,
      });
    } else {
      ok.push({ module: it.module, idx: it.idx, title: it.title });
    }
  }
  const unattributed = byBinding.get("<unattributed>") || [];
  return { ok, failures, unattributed, report };
}

/**
 * Verify every example in `generated`, iterating to a FIXPOINT. Returns:
 *   { ok: [{module,idx,title}], failures: [{module,idx,title,firstErrorLine}],
 *     fatal?: string }
 *
 * Why iterate: elm's type checker attributes only the errors it reaches. A
 * naming error (e.g. a reference to a non-existent module member) in binding A
 * can stop elm before it fully type-checks binding B, so a single pass
 * under-reports. We drop the failures found this pass, recompile the survivors,
 * and repeat until a pass finds NO new failures — at which point every
 * surviving example provably compiles together.
 *
 * A `fatal` string means the scratch app didn't build for structural reasons
 * (report not JSON / bad elm.json) — caller should treat that as a harness bug.
 */
export function verifyExamples(generated, { verbose = false } = {}) {
  let items = flattenExamples(generated);
  if (items.length === 0) return { ok: [], failures: [] };

  const allFailures = []; // accumulated across passes (first error wins)
  const failedKeys = new Set();
  let lastUnattributed = [];

  for (let pass = 1; ; pass++) {
    const res = verifyOnce(items);
    if (res.fatal) return { ok: [], failures: allFailures, fatal: res.fatal };
    lastUnattributed = res.unattributed;

    if (verbose) {
      console.error(
        `verify pass ${pass}: ${res.ok.length} ok, ${res.failures.length} failed` +
          (res.unattributed.length
            ? `, ${res.unattributed.length} unattributed`
            : ""),
      );
    }

    if (res.failures.length === 0) {
      // Fixpoint: every remaining item compiles together.
      return { ok: res.ok, failures: allFailures, unattributed: res.unattributed };
    }

    // Record this pass's failures and drop them for the next pass.
    for (const f of res.failures) {
      const key = `${f.module}#${f.idx}`;
      if (!failedKeys.has(key)) {
        failedKeys.add(key);
        allFailures.push(f);
      }
    }
    items = items.filter(
      (it) => !failedKeys.has(`${it.module}#${it.idx}`),
    );
    if (items.length === 0) {
      return { ok: [], failures: allFailures, unattributed: lastUnattributed };
    }
  }
}

// -------------------------- CLI -------------------------------------------
function isMain() {
  return (
    process.argv[1] &&
    process.argv[1].endsWith("verify-examples.mjs")
  );
}

if (isMain()) {
  const path =
    process.argv[2] || `${M3E_ROOT}/config/examples.generated.json`;
  const generated = JSON.parse(readFileSync(path, "utf8"));
  const { ok, failures, fatal, unattributed } = verifyExamples(generated, {
    verbose: true,
  });
  if (fatal) {
    console.error("FATAL — scratch app did not build:\n" + fatal);
    process.exit(2);
  }
  console.log(`compiled OK: ${ok.length}`);
  console.log(`FAILED: ${failures.length}`);
  for (const f of failures) {
    console.log(`  ${f.module} [#${f.idx}] "${f.title}" :: ${f.firstErrorLine}`);
  }
  if (unattributed && unattributed.length) {
    console.log(`unattributed errors: ${unattributed.length}`);
  }
}
