import { describe, expect, it } from "vitest";

import { reportAgeDays } from "@/lib/freshness";

describe("reportAgeDays", () => {
  it("calculates age from the source report date to the current date", () => {
    expect(reportAgeDays("2026-10-23", "2026-10-30")).toBe(7);
  });

  it("returns zero for today's or a future report date", () => {
    expect(reportAgeDays("2026-10-30", "2026-10-30")).toBe(0);
    expect(reportAgeDays("2026-10-31", "2026-10-30")).toBe(0);
  });

  it("returns null for invalid dates", () => {
    expect(reportAgeDays("not-a-date", "2026-10-30")).toBeNull();
  });
});
