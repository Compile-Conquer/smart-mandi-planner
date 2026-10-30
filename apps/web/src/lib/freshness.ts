export function reportAgeDays(reportDate: string, asOfDate: string): number | null {
  const reportTime = Date.parse(`${reportDate}T00:00:00Z`);
  const asOfTime = Date.parse(`${asOfDate}T00:00:00Z`);
  if (!Number.isFinite(reportTime) || !Number.isFinite(asOfTime)) return null;
  return Math.max(0, Math.floor((asOfTime - reportTime) / 86_400_000));
}
