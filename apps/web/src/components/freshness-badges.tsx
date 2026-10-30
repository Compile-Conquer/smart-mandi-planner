"use client";

import { AlertCircle, CheckCircle2, Clock3 } from "lucide-react";
import { useSyncExternalStore } from "react";

import type { Dictionary } from "@/i18n/types";
import { formatDate, formatDays } from "@/lib/format";
import { reportAgeDays } from "@/lib/freshness";
import type { Locale } from "@/lib/types";
import { freshnessStatus } from "@/lib/types";

const subscribeToDate = () => () => {};
const getCurrentUtcDate = () => new Date().toISOString().slice(0, 10);
const getServerUtcDate = () => null;

export function useCurrentUtcDate() {
  return useSyncExternalStore(subscribeToDate, getCurrentUtcDate, getServerUtcDate);
}

export function StatusBadge({
  reportDate,
  threshold,
  locale,
  copy,
}: {
  reportDate: string;
  threshold: number;
  locale: Locale;
  copy: Dictionary["common"];
}) {
  const asOfDate = useCurrentUtcDate();
  const days = asOfDate ? reportAgeDays(reportDate, asOfDate) : null;

  if (days === null) {
    return (
      <span
        className="status-badge status-badge--pending"
        aria-label={`${copy.latestReport}: ${formatDate(reportDate, locale)}`}
      >
        —
      </span>
    );
  }

  const status = freshnessStatus(days, threshold);
  const label = status === "fresh" ? copy.fresh : status === "recent" ? copy.recent : copy.stale;
  const Icon = status === "fresh" ? CheckCircle2 : status === "recent" ? Clock3 : AlertCircle;
  return (
    <span className={`status-badge status-badge--${status}`}>
      <Icon size={13} aria-hidden="true" />
      {label} · {formatDays(days, locale)}
    </span>
  );
}

export function FreshnessSummary({
  reportDates,
  threshold,
  label,
}: {
  reportDates: string[];
  threshold: number;
  label: string;
}) {
  const asOfDate = useCurrentUtcDate();
  const freshCount = asOfDate
    ? reportDates.filter((reportDate) => {
        const days = reportAgeDays(reportDate, asOfDate);
        return days !== null && freshnessStatus(days, threshold) === "fresh";
      }).length
    : null;

  const shownCount = freshCount ?? 0;
  const ratio = reportDates.length ? (shownCount / reportDates.length) * 100 : 0;
  return (
    <div className="state-card__freshness" aria-label={label}>
      <span>
        <i style={{ width: `${ratio}%` }} />
      </span>
      <small>
        {freshCount === null ? `—/${reportDates.length}` : `${shownCount}/${reportDates.length}`}{" "}
        {label}
      </small>
    </div>
  );
}
