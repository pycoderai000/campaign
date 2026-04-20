"use client";

import type { BrandMonitoringSource } from "@/types";

interface BrandMonitoringSourceListProps {
  sources: BrandMonitoringSource[];
  emptyMessage?: string;
}

function formatSourceType(value: BrandMonitoringSource["sourceType"]) {
  switch (value) {
    case "instagram":
      return "Instagram";
    case "linkedin":
      return "LinkedIn";
    case "leadership":
      return "Leadership";
    case "website":
      return "Website";
    case "news":
    default:
      return "News";
  }
}

export default function BrandMonitoringSourceList({
  sources,
  emptyMessage = "No monitoring sources configured.",
}: BrandMonitoringSourceListProps) {
  if (sources.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50/80 p-4 text-sm text-gray-500">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {sources.map((source, index) => (
        <div
          key={source.id ?? `${source.name}-${source.sourceType}-${index}`}
          className="rounded-xl border border-gray-200 bg-white px-4 py-3"
        >
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-indigo-100 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-indigo-700">
              {formatSourceType(source.sourceType)}
            </span>
            <span
              className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                source.isActive === false
                  ? "bg-gray-100 text-gray-600"
                  : "bg-emerald-100 text-emerald-700"
              }`}
            >
              {source.isActive === false ? "Inactive" : "Active"}
            </span>
          </div>
          <h4 className="mt-2 text-sm font-semibold text-slate-800">{source.name}</h4>
          {source.query && (
            <p className="mt-1 text-sm text-gray-600 line-clamp-2">{source.query}</p>
          )}
          {source.sourceUrl && (
            <p className="mt-1 break-all text-xs text-gray-500">{source.sourceUrl}</p>
          )}
        </div>
      ))}
    </div>
  );
}
