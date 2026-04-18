"use client";

import type { BrandScrapedItem } from "@/types";

interface BrandMonitoringFeedProps {
  items: BrandScrapedItem[];
  loading?: boolean;
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
  return parsed.toLocaleString();
}

export default function BrandMonitoringFeed({
  items,
  loading = false,
}: BrandMonitoringFeedProps) {
  if (loading) {
    return (
      <div className="bg-white/80 backdrop-blur-sm p-16 rounded-2xl shadow-soft text-center border border-gray-200">
        <p className="text-gray-600 text-lg font-semibold">Loading feed…</p>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="bg-white/80 backdrop-blur-sm p-16 rounded-2xl shadow-soft text-center border border-gray-200">
        <p className="text-gray-600 text-lg font-semibold mb-2">No monitored content yet</p>
        <p className="text-gray-400 text-sm">
          Once the daily sync runs, tracked articles, website updates, and social posts will appear here as cards.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
      {items.map((item) => (
        <a
          key={item.id}
          href={item.url}
          target="_blank"
          rel="noopener noreferrer"
          className="group block rounded-2xl border border-gray-200 bg-white/80 backdrop-blur-sm overflow-hidden shadow-soft hover:shadow-hover transition-all duration-200 hover:-translate-y-1"
        >
          {item.imageUrl ? (
            <div className="h-44 bg-gray-100 overflow-hidden">
              <img
                src={item.imageUrl}
                alt={item.title}
                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
            </div>
          ) : (
            <div className="h-44 bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 flex items-center justify-center">
              <div className="text-center px-6">
                <p className="text-xs font-semibold uppercase tracking-wider text-indigo-700">
                  {formatSourceType(item.sourceType)}
                </p>
                <p className="mt-2 text-sm font-bold text-slate-700">
                  {item.publisher || "Monitored source"}
                </p>
              </div>
            </div>
          )}

          <div className="p-5 space-y-3">
            <div className="flex items-center justify-between gap-3">
              <span className="px-2.5 py-1 rounded-full bg-indigo-100 text-indigo-700 text-[11px] font-semibold uppercase tracking-wide">
                {formatSourceType(item.sourceType)}
              </span>
              <span className="text-xs text-gray-500">{formatDate(item.publishedAt || item.createdAt)}</span>
            </div>

            <div>
              <h3 className="text-base font-bold text-slate-800 group-hover:text-indigo-700 transition-colors line-clamp-2">
                {item.title}
              </h3>
              {item.publisher && (
                <p className="mt-1 text-sm font-medium text-gray-500">{item.publisher}</p>
              )}
            </div>

            {item.summary && (
              <p className="text-sm text-gray-600 line-clamp-4">{item.summary}</p>
            )}

            <div className="pt-1 text-sm font-semibold text-indigo-600 group-hover:text-indigo-700">
              Open source →
            </div>
          </div>
        </a>
      ))}
    </div>
  );
}
