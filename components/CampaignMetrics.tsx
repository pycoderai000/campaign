"use client";

import { useState, useMemo, useEffect } from "react";
import MetricsChart from "./MetricsChart";
import type { Campaign, Deliverable, CampaignMetrics as CampaignMetricsType } from "@/types";
import { api } from "@/lib/api";

interface CampaignMetricsProps {
  campaigns: Campaign[];
  deliverables: Deliverable[];
}

export default function CampaignMetrics({ campaigns, deliverables }: CampaignMetricsProps) {
  const [selectedCampaign, setSelectedCampaign] = useState<string>("all");
  const [selectedMetric, setSelectedMetric] = useState<"impressions" | "reach" | "engagement">(
    "impressions"
  );
  const [apiMetrics, setApiMetrics] = useState<CampaignMetricsType[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await api.get<{ campaignId: string; date: string; impressions: number; reach: number; likes: number; comments: number; engagement: number }[]>(
          "/api/metrics"
        );
        if (!cancelled && Array.isArray(data)) {
          setApiMetrics(
            data.map((m) => ({
              campaignId: m.campaignId,
              date: m.date.length === 10 ? `${m.date}T00:00:00.000Z` : m.date,
              impressions: m.impressions,
              reach: m.reach,
              likes: m.likes,
              comments: m.comments,
              engagement: m.engagement,
            }))
          );
        }
      } catch {
        if (!cancelled) setApiMetrics([]);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const mockMetrics: CampaignMetricsType[] = useMemo(() => {
    const metrics: CampaignMetricsType[] = [];
    const today = new Date();
    campaigns.forEach((campaign) => {
      const campaignDeliverables = deliverables.filter((d) => d.campaignId === campaign.id);
      for (let i = 0; i < 30; i += 3) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const impressions = campaignDeliverables.length * (1000 + Math.random() * 5000);
        const reach = impressions * (0.6 + Math.random() * 0.3);
        const likes = reach * (0.1 + Math.random() * 0.2);
        const comments = likes * (0.05 + Math.random() * 0.1);
        const engagement = likes + comments * 2;
        metrics.push({
          campaignId: campaign.id,
          impressions: Math.round(impressions),
          reach: Math.round(reach),
          likes: Math.round(likes),
          comments: Math.round(comments),
          engagement: Math.round(engagement),
          date: date.toISOString(),
        });
      }
    });
    return metrics.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [campaigns, deliverables]);

  const metrics = apiMetrics.length > 0 ? apiMetrics : mockMetrics;

  const filteredMetrics = useMemo(() => {
    if (selectedCampaign === "all") {
      const aggregated: Record<string, CampaignMetricsType> = {};
      metrics.forEach((metric) => {
        const date = metric.date.split("T")[0];
        if (!aggregated[date]) {
          aggregated[date] = {
            campaignId: "all",
            impressions: 0,
            reach: 0,
            likes: 0,
            comments: 0,
            engagement: 0,
            date: metric.date,
          };
        }
        aggregated[date].impressions += metric.impressions;
        aggregated[date].reach += metric.reach;
        aggregated[date].likes += metric.likes;
        aggregated[date].comments += metric.comments;
        aggregated[date].engagement += metric.engagement;
      });
      return Object.values(aggregated);
    }
    return metrics.filter((m) => m.campaignId === selectedCampaign);
  }, [selectedCampaign, metrics]);

  const chartData = useMemo(() => {
    return filteredMetrics.map((metric) => ({
      date: metric.date,
      value:
        selectedMetric === "impressions"
          ? metric.impressions
          : selectedMetric === "reach"
          ? metric.reach
          : metric.engagement,
    }));
  }, [filteredMetrics, selectedMetric]);

  const totalMetrics = useMemo(() => {
    return filteredMetrics.reduce(
      (acc, metric) => ({
        impressions: acc.impressions + metric.impressions,
        reach: acc.reach + metric.reach,
        likes: acc.likes + metric.likes,
        comments: acc.comments + metric.comments,
        engagement: acc.engagement + metric.engagement,
      }),
      { impressions: 0, reach: 0, likes: 0, comments: 0, engagement: 0 }
    );
  }, [filteredMetrics]);

  if (campaigns.length === 0) {
    return (
      <div className="bg-white/80 backdrop-blur-sm p-16 rounded-2xl shadow-soft text-center border border-gray-200">
        <div className="w-20 h-20 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <svg className="w-10 h-10 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </div>
        <p className="text-gray-600 text-base sm:text-lg font-semibold mb-2">No campaigns available</p>
        <p className="text-gray-400 text-xs sm:text-sm">Create campaigns to view metrics</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="bg-white/80 backdrop-blur-sm p-4 sm:p-6 lg:p-8 rounded-xl sm:rounded-2xl shadow-soft border border-gray-200">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <div>
            <label className="block text-xs sm:text-sm font-bold text-gray-700 mb-2 sm:mb-3">
              Select Campaign
            </label>
            <select
              value={selectedCampaign}
              onChange={(e) => setSelectedCampaign(e.target.value)}
              className="w-full px-3 sm:px-4 py-2 sm:py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all bg-white appearance-none cursor-pointer font-semibold text-sm sm:text-base"
            >
              <option value="all">All Campaigns</option>
              {campaigns.map((campaign) => (
                <option key={campaign.id} value={campaign.id}>
                  {campaign.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-3">
              Select Metric
            </label>
            <select
              value={selectedMetric}
              onChange={(e) =>
                setSelectedMetric(e.target.value as "impressions" | "reach" | "engagement")
              }
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all bg-white appearance-none cursor-pointer font-semibold"
            >
              <option value="impressions">Impressions</option>
              <option value="reach">Reach</option>
              <option value="engagement">Engagement</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 sm:gap-4 mb-6 sm:mb-8">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 sm:p-6 rounded-xl sm:rounded-2xl border border-blue-200 shadow-sm">
            <div className="flex items-center gap-1 sm:gap-2 mb-2">
              <span className="text-xl sm:text-2xl">👁️</span>
              <p className="text-xs font-bold text-blue-600 uppercase tracking-wide">Impressions</p>
            </div>
            <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-blue-700">
              {totalMetrics.impressions.toLocaleString()}
            </p>
          </div>
          <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 sm:p-6 rounded-xl sm:rounded-2xl border border-green-200 shadow-sm">
            <div className="flex items-center gap-1 sm:gap-2 mb-2">
              <span className="text-xl sm:text-2xl">📊</span>
              <p className="text-xs font-bold text-green-600 uppercase tracking-wide">Reach</p>
            </div>
            <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-green-700">
              {totalMetrics.reach.toLocaleString()}
            </p>
          </div>
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 sm:p-6 rounded-xl sm:rounded-2xl border border-purple-200 shadow-sm">
            <div className="flex items-center gap-1 sm:gap-2 mb-2">
              <span className="text-xl sm:text-2xl">❤️</span>
              <p className="text-xs font-bold text-purple-600 uppercase tracking-wide">Likes</p>
            </div>
            <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-purple-700">
              {totalMetrics.likes.toLocaleString()}
            </p>
          </div>
          <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 p-4 sm:p-6 rounded-xl sm:rounded-2xl border border-yellow-200 shadow-sm">
            <div className="flex items-center gap-1 sm:gap-2 mb-2">
              <span className="text-xl sm:text-2xl">💬</span>
              <p className="text-xs font-bold text-yellow-600 uppercase tracking-wide">Comments</p>
            </div>
            <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-yellow-700">
              {totalMetrics.comments.toLocaleString()}
            </p>
          </div>
          <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 p-4 sm:p-6 rounded-xl sm:rounded-2xl border border-indigo-200 shadow-sm">
            <div className="flex items-center gap-1 sm:gap-2 mb-2">
              <span className="text-xl sm:text-2xl">🚀</span>
              <p className="text-xs font-bold text-indigo-600 uppercase tracking-wide">Engagement</p>
            </div>
            <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-indigo-700">
              {totalMetrics.engagement.toLocaleString()}
            </p>
          </div>
        </div>

        {chartData.length > 0 ? (
          <div className="bg-gradient-to-br from-gray-50 to-white p-4 sm:p-6 rounded-xl sm:rounded-2xl border border-gray-200">
            <MetricsChart data={chartData} metricType={selectedMetric} />
          </div>
        ) : (
          <div className="h-64 sm:h-80 flex items-center justify-center bg-gradient-to-br from-gray-50 to-white rounded-xl sm:rounded-2xl border border-gray-200">
            <div className="text-center">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-100 rounded-xl sm:rounded-2xl flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <svg className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <p className="text-gray-500 font-semibold">No metrics data available yet</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

