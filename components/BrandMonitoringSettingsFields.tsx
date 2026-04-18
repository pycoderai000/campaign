"use client";

import type { BrandMonitoringSource, BrandMonitoringSourceType } from "@/types";

interface BrandMonitoringSettingsValue {
  monitoringEnabled: boolean;
  monitoringTime: string;
  monitoringSources: BrandMonitoringSource[];
}

interface BrandMonitoringSettingsFieldsProps {
  value: BrandMonitoringSettingsValue;
  onChange: (next: BrandMonitoringSettingsValue) => void;
}

const sourceTypes: { value: BrandMonitoringSourceType; label: string }[] = [
  { value: "news", label: "News" },
  { value: "website", label: "Website" },
  { value: "leadership", label: "Leadership" },
  { value: "instagram", label: "Instagram" },
  { value: "linkedin", label: "LinkedIn" },
];

function createEmptySource(): BrandMonitoringSource {
  return {
    name: "",
    sourceType: "news",
    sourceUrl: "",
    query: "",
    isActive: true,
  };
}

export default function BrandMonitoringSettingsFields({
  value,
  onChange,
}: BrandMonitoringSettingsFieldsProps) {
  const sources =
    value.monitoringSources.length > 0 ? value.monitoringSources : [createEmptySource()];

  const updateSource = (index: number, patch: Partial<BrandMonitoringSource>) => {
    const next = sources.map((source, sourceIndex) =>
      sourceIndex === index ? { ...source, ...patch } : source
    );
    onChange({ ...value, monitoringSources: next });
  };

  const removeSource = (index: number) => {
    const next = sources.filter((_, sourceIndex) => sourceIndex !== index);
    onChange({
      ...value,
      monitoringSources: next.length > 0 ? next : [createEmptySource()],
    });
  };

  return (
    <div className="border-t border-gray-200 pt-4 sm:pt-6 mt-4 sm:mt-6">
      <div className="flex items-start justify-between gap-4 mb-3">
        <div>
          <h3 className="text-base sm:text-lg font-bold text-gray-800">Daily web monitoring</h3>
          <p className="text-xs sm:text-sm text-gray-600 mt-1">
            Add the companies/entities and the information to monitor across news, websites, leadership pages, Instagram, and LinkedIn. The sync runs once daily at the selected server time.
          </p>
        </div>
        <label className="inline-flex items-center gap-2 text-sm font-semibold text-gray-700">
          <input
            type="checkbox"
            checked={value.monitoringEnabled}
            onChange={(e) => onChange({ ...value, monitoringEnabled: e.target.checked })}
            className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
          />
          Enable
        </label>
      </div>

      <div className="mb-4">
        <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-2">
          Daily sync time <span className="text-gray-500 text-xs">(server time)</span>
        </label>
        <input
          type="time"
          value={value.monitoringTime}
          onChange={(e) => onChange({ ...value, monitoringTime: e.target.value })}
          className="w-full sm:w-56 px-3 sm:px-4 py-2.5 sm:py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all bg-white/50 backdrop-blur-sm text-sm sm:text-base"
        />
      </div>

      <div className="space-y-4">
        {sources.map((source, index) => {
          const sourceType = source.sourceType ?? "news";
          const needsTarget = sourceType !== "news";
          const targetLabel =
            sourceType === "instagram"
              ? "Instagram profile URL or username"
              : sourceType === "linkedin"
              ? "LinkedIn company/profile URL"
              : "Source URL";
          const targetPlaceholder =
            sourceType === "news"
              ? "Optional: company news page or RSS URL"
              : sourceType === "instagram"
              ? "Required: https://instagram.com/company or @company"
              : sourceType === "linkedin"
              ? "Required: https://www.linkedin.com/company/company-name/"
              : "Required: official website / leadership page / newsroom URL";
          const queryPlaceholder =
            sourceType === "instagram"
              ? "Optional: campaign keywords, hashtags, or topics to prioritize in captions"
              : sourceType === "linkedin"
              ? "Optional: campaign keywords or topics to prioritize in company posts"
              : "Example: announcements, funding, tenders, official updates, leadership news";
          return (
            <div key={index} className="rounded-2xl border border-gray-200 bg-white/70 p-4 space-y-3">
              <div className="flex items-center justify-between gap-3">
                <h4 className="text-sm font-bold text-gray-800">Source {index + 1}</h4>
                <button
                  type="button"
                  onClick={() => removeSource(index)}
                  className="px-3 py-1.5 rounded-lg bg-red-100 text-red-700 text-xs font-semibold hover:bg-red-200"
                >
                  Remove
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-2">
                    Company / entity name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={source.name ?? ""}
                    onChange={(e) => updateSource(index, { name: e.target.value })}
                    placeholder="Example: IHC, 2PointZero, Dubai Government"
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all bg-white text-sm sm:text-base"
                  />
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-2">
                    Source type <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={sourceType}
                    onChange={(e) =>
                      updateSource(index, {
                        sourceType: e.target.value as BrandMonitoringSourceType,
                      })
                    }
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all bg-white text-sm sm:text-base"
                  >
                    {sourceTypes.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-2">
                  Information to scrape
                </label>
                <input
                  type="text"
                  value={source.query ?? ""}
                  onChange={(e) => updateSource(index, { query: e.target.value })}
                  placeholder={queryPlaceholder}
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all bg-white text-sm sm:text-base"
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-2">
                  {targetLabel}{" "}
                  {needsTarget ? (
                    <span className="text-red-500">*</span>
                  ) : (
                    <span className="text-gray-500 text-xs">(optional)</span>
                  )}
                </label>
                <input
                  type={sourceType === "instagram" ? "text" : "url"}
                  value={source.sourceUrl ?? ""}
                  onChange={(e) => updateSource(index, { sourceUrl: e.target.value })}
                  placeholder={targetPlaceholder}
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all bg-white text-sm sm:text-base"
                />
              </div>

              <label className="inline-flex items-center gap-2 text-sm font-medium text-gray-700">
                <input
                  type="checkbox"
                  checked={source.isActive ?? true}
                  onChange={(e) => updateSource(index, { isActive: e.target.checked })}
                  className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                Active source
              </label>
            </div>
          );
        })}
      </div>

      <button
        type="button"
        onClick={() =>
          onChange({
            ...value,
            monitoringSources: [...sources, createEmptySource()],
          })
        }
        className="mt-4 px-3 py-2 rounded-lg bg-indigo-100 text-indigo-700 text-xs font-semibold hover:bg-indigo-200"
      >
        + Add source
      </button>
    </div>
  );
}
