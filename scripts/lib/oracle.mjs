// Mapping oracle: per-tag lookup derived from the Custom Elements Manifest
// (@m3e/web custom-elements.json) + config/slots.json. Feeds the HTML->Elm
// mapper so it can turn `<m3e-button variant="filled">` into typed M3e.* calls.

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { camel, pascal, avoidConflicts } from "./naming.mjs";

// scripts/lib/oracle.mjs -> repo root is four levels up
const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(HERE, "..", "..", "..");

const CEM_PATH = resolve(
  REPO_ROOT,
  "docs/node_modules/@m3e/web/dist/custom-elements.json"
);
const SLOTS_PATH = resolve(REPO_ROOT, "config/slots.json");

function readJson(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}

// Kebab-case a config key: insert "-" before each interior uppercase, lowercase
// the whole thing. Already-kebab keys pass through unchanged.
function kebab(key) {
  return String(key)
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .toLowerCase();
}

// Extract quoted string-literal values from a TS union type text.
function enumLiterals(typeText) {
  const out = [];
  const re = /'([^']*)'/g;
  let m;
  while ((m = re.exec(typeText)) !== null) out.push(m[1]);
  return out;
}

export function buildOracle() {
  const cem = readJson(CEM_PATH);
  const slots = readJson(SLOTS_PATH);

  const oracle = {};

  for (const mod of cem.modules ?? []) {
    for (const d of mod.declarations ?? []) {
      const tag = d.tagName;
      if (!tag) continue;

      // module: strip library prefix (up to and incl. first "-"), then pascal.
      const rest = tag.slice(tag.indexOf("-") + 1);
      const module = pascal(rest);
      const moduleConfig = slots[module] ?? {};

      // attributes
      const attributes = [];
      const setterNames = new Set();
      for (const attr of d.attributes ?? []) {
        const htmlName = attr.name;
        // taken = the other attributes' setter names already assigned
        const setter = avoidConflicts(camel(htmlName), setterNames);
        setterNames.add(setter);

        const typeText = attr.type?.text ?? "";
        const enumSource = attr.parsedType?.text ?? attr.type?.text ?? "";
        let kind;
        let enumValues = [];
        if (typeText === "boolean") {
          kind = "bool";
        } else {
          const lits = enumLiterals(enumSource);
          if (lits.length >= 2) {
            kind = "enum";
            enumValues = lits;
          } else {
            kind = "string";
          }
        }
        attributes.push({ htmlName, setter, kind, enumValues });
      }

      // requiredFields from slots.json[module].required (field -> kind object)
      const requiredFields = [];
      const requiredConfig = moduleConfig.required;
      if (requiredConfig && typeof requiredConfig === "object") {
        for (const key of Object.keys(requiredConfig)) {
          // Keys may be camelCase (e.g. "ariaLabel"). camel() collapses a
          // separator-free word to lowercase, so kebab first to recover the
          // word boundaries: camel(kebab("ariaLabel")) === "ariaLabel".
          const htmlName = kebab(key);
          requiredFields.push({ field: camel(htmlName), htmlName });
        }
      }

      // slots
      const slotEntries = [];
      const slotConfig = moduleConfig.slots ?? {};
      for (const slot of d.slots ?? []) {
        const rawName = slot.name;
        let helper;
        if (rawName === "") {
          helper = "child";
        } else {
          const base = camel(rawName);
          helper = setterNames.has(base) ? base + "Slot" : base;
        }
        const cfgKey = rawName === "" ? "default" : rawName;
        const cfg = slotConfig[cfgKey] ?? {};
        const kind = cfg.kinds?.[0] ?? "any";
        // A required, single-value default slot is folded by the codegen into
        // the view's required record as a `content` field (not a `child`
        // helper). The mapper needs required/multi to reproduce that.
        const required = cfg.required === true;
        const multi = cfg.multi === true;
        slotEntries.push({ rawName, helper, kind, required, multi });
      }

      oracle[tag] = {
        tag,
        module,
        attributes,
        requiredFields,
        slots: slotEntries,
      };
    }
  }

  return oracle;
}
