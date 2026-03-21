/**
 * Normalize postingDate from API/DB to YYYY-MM-DD for calendar matching.
 * Handles ISO datetimes and un-padded dates.
 */
export function normalizePostingDateToYmd(input: string | undefined | null): string | null {
  if (input == null || typeof input !== "string") return null;
  const t = input.trim();
  if (!t) return null;
  const m = /^(\d{4})-(\d{1,2})-(\d{1,2})/.exec(t);
  if (m) {
    return `${m[1]}-${m[2].padStart(2, "0")}-${m[3].padStart(2, "0")}`;
  }
  const d = new Date(t);
  if (!Number.isNaN(d.getTime())) {
    const y = d.getFullYear();
    const mo = d.getMonth() + 1;
    const day = d.getDate();
    return `${y}-${String(mo).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  }
  return null;
}
