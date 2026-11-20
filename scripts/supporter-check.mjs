// Self-check for lib/supporter-access.ts. Run: node scripts/supporter-check.mjs (Node 22.18+ or 24 strips TS types natively).
import assert from "node:assert/strict";

const { isActiveSupporter } = await import(new URL("../lib/supporter-access.ts", import.meta.url).href);

const NOW = Date.parse("2026-11-20T00:00:00Z");
const future = "2026-12-20T00:00:00Z";
const past = "2026-10-20T00:00:00Z";

assert.equal(isActiveSupporter(null, NOW), false); // no row: may subscribe
assert.equal(isActiveSupporter(undefined, NOW), false);
assert.equal(isActiveSupporter({ active: true, current_period_end: future }, NOW), true);
assert.equal(isActiveSupporter({ active: true, current_period_end: null }, NOW), true); // no end date recorded
assert.equal(isActiveSupporter({ active: true, current_period_end: past }, NOW), false); // lapsed
assert.equal(isActiveSupporter({ active: false, current_period_end: future }, NOW), false); // cancelled
assert.equal(isActiveSupporter({ active: null, current_period_end: null }, NOW), false);
assert.equal(isActiveSupporter({ active: true, current_period_end: "not a date" }, NOW), false); // fail closed

console.log("supporter-check: all assertions passed");
