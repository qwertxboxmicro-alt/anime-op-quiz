// Self-check for lib/streak.ts. Run: node scripts/streak-check.mjs (Node 22.18+ or 24 strips TS types natively).
import assert from "node:assert/strict";

const { statsFromRows, freezeCandidates } = await import(new URL("../lib/streak.ts", import.meta.url).href);

const T = 20800; // "today" for these fixtures
const win = (day) => ({ day, won: true, tries: 2 });
const loss = (day) => ({ day, won: false, tries: 6 });

// No freezes: a missed day still breaks the streak (signed-out / non-supporter behaviour).
assert.equal(statsFromRows([win(T - 3), win(T - 2), win(T - 1), win(T)], T).streak, 4);
assert.equal(statsFromRows([win(T - 4), win(T - 3), win(T - 1), win(T)], T).streak, 2);
assert.equal(statsFromRows([win(T - 4), win(T - 3), win(T - 1), win(T)], T).best, 2);

// Frozen day bridges exactly one missed day.
assert.equal(statsFromRows([win(T - 4), win(T - 3), win(T - 1), win(T)], T, [T - 2]).streak, 4);
assert.equal(statsFromRows([win(T - 4), win(T - 3), win(T - 1), win(T)], T, [T - 2]).best, 4);

// Two missed days in a row are not bridged by one freeze.
assert.equal(statsFromRows([win(T - 4), win(T - 3), win(T)], T, [T - 2]).streak, 1);

// A loss is not bridged by a freeze (streak is already 0 there).
assert.equal(statsFromRows([win(T - 2), loss(T - 1), win(T)], T, [T - 1]).streak, 1);

// Trailing miss: yesterday frozen keeps the streak alive before today is played.
assert.equal(statsFromRows([win(T - 3), win(T - 2)], T, [T - 1]).streak, 2);
assert.equal(statsFromRows([win(T - 3), win(T - 2)], T).streak, 0);

// Candidates: interior single miss after a win, one per calendar month, none if month already has a freeze.
const jan = 20454; // 2026-01-01, a freeze in another calendar month
assert.deepEqual(freezeCandidates([win(T - 4), win(T - 3), win(T - 1), win(T)], T), [T - 2]);
assert.deepEqual(freezeCandidates([win(T - 4), win(T - 3), win(T - 1), win(T)], T, [T - 2]), []);
assert.deepEqual(freezeCandidates([win(T - 3), win(T - 2)], T), [T - 1]);
assert.deepEqual(freezeCandidates([win(T - 3), win(T - 2)], T, [T - 1]), []);
assert.deepEqual(freezeCandidates([win(T - 4), loss(T - 3), win(T - 1), win(T)], T), []); // broken by a loss, not a streak to save
assert.deepEqual(freezeCandidates([win(T - 4), win(T - 3), win(T - 1), win(T)], T, [jan]).length, 1); // unrelated month freeze does not block

// Month rule: two misses in the same UTC month, only the earliest is planned (20805-20809 are all 2026-12).
const sameMonth = [win(20805), win(20807), win(20809)]; // misses 20806 and 20808
const sameMonthPlan = freezeCandidates(sameMonth, 20810);
assert.equal(sameMonthPlan.length, 1);
assert.equal(sameMonthPlan[0], 20806);

console.log("streak-check: all assertions passed");
