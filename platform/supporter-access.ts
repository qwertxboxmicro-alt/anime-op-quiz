// Pure check: does a `supporters` row grant an active Supporter right now?
// Null period end means no end date is recorded, so it counts as active. Unparseable dates fail closed.
export type SupporterRow = { active: boolean | null; current_period_end: string | null };

export function isActiveSupporter(row: SupporterRow | null | undefined, nowMs: number = Date.now()): boolean {
  if (!row || row.active !== true) return false;
  if (row.current_period_end == null) return true;
  const end = Date.parse(row.current_period_end);
  return !Number.isNaN(end) && end > nowMs;
}
