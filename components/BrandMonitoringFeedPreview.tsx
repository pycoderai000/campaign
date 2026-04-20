"use client";

import type { BrandScrapedItem } from "@/types";

interface BrandMonitoringFeedPreviewProps {
  items: BrandScrapedItem[];
  loading?: boolean;
  limit?: number;
  emptyMessage?: string;
}

function formatSourceType(value: BrandScrapedItem["sourceType"]) {
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

function formatDate(value?: string) {
  if (!value) return "Recently added";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "Recently added";
  return parsed.toLocaleDateString();
}

export default function BrandMonitoringFeedPreview({
  items,
  loading = false,
  limit = 3,
  emptyMessage = "No monitored content yet.",
}: BrandMonitoringFeedPreviewProps) {
  const visibleItems = items.slice(0, limit);

  if (loading) {
    return (
      <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50/80 p-4 text-sm text-gray-500">
        Loading monitored content…
      </div>
    );
  }

  if (visibleItems.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50/80 p-4 text-sm text-gray-500">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {visibleItems.map((item) => (
        <a
          key={item.id}
          href={item.url}
          target="_blank"
          rel="noopener noreferrer"
          className="block rounded-xl border border-gray-200 bg-white px-4 py-3 transition-colors hover:border-indigo-300 hover:bg-indigo-50/40"
        >
          <div className="flex items-center justify-between gap-3">
            <span className="rounded-full bg-indigo-100 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-indigo-700">
              {formatSourceType(item.sourceType)}
            </span>
            <span className="text-xs text-gray-500">{formatDate(item.publishedAt || item.createdAt)}</span>
          </div>
          <h4 className="mt-2 text-sm font-semibold text-slate-800 line-clamp-2">{item.title}</h4>
          {item.summary && (
            <p className="mt-1 text-sm text-gray-600 line-clamp-2">{item.summary}</p>
          )}
          {item.publisher && (
            <p className="mt-1 text-xs text-gray-500 line-clamp-1">{item.publisher}</p>
          )}
        </a>
      ))}
    </div>
  );
}
