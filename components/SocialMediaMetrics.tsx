"use client";

import { useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import type { SocialMediaMetrics } from "@/types";

interface SocialMediaMetricsProps {
  metrics: SocialMediaMetrics;
}

export default function SocialMediaMetrics({ metrics }: SocialMediaMetricsProps) {
  const [selectedPlatform, setSelectedPlatform] = useState<"instagram" | "youtube" | "tiktok">("instagram");
  const [selectedMetric, setSelectedMetric] = useState<"followers" | "engagement">("followers");

  // Get platform-specific metrics
  const getPlatformMetrics = () => {
    if (selectedPlatform === "instagram" && metrics.instagram) {
      return metrics.instagram;
    }
    if (selectedPlatform === "youtube" && metrics.youtube) {
      return metrics.youtube;
    }
    if (selectedPlatform === "tiktok" && metrics.tiktok) {
      return metrics.tiktok;
    }
    // Fallback to legacy format
    return {
      followers: metrics.followers || [],
      engagementGrowth: metrics.engagementGrowth || [],
      totalFollowers: metrics.totalFollowers || 0,
      engagementRate: metrics.engagementRate || 0,
    };
  };

  const platformMetrics = getPlatformMetrics();

  const followersData = platformMetrics.followers.map((f) => ({
    month: f.month,
    followers: f.count,
  }));

  const engagementData = platformMetrics.engagementGrowth.map((e) => ({
    month: e.month,
    growth: e.growth,
  }));

  const chartData = selectedMetric === "followers" ? followersData : engagementData;

  const platformNames = {
    instagram: "Instagram",
    youtube: "YouTube",
    tiktok: "TikTok",
  };

  const platformIcons = {
    instagram: "📷",
    youtube: "📺",
    tiktok: "🎵",
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="bg-white/80 backdrop-blur-sm p-4 sm:p-6 lg:p-8 rounded-xl sm:rounded-2xl shadow-soft border border-gray-200">
        <div className="mb-4 sm:mb-6">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-800 mb-2">Social Media Metrics</h2>
          <p className="text-sm sm:text-base text-gray-600">Track your social media performance</p>
        </div>

        {/* Platform Selector */}
        <div className="flex flex-wrap gap-2 sm:gap-3 mb-4 sm:mb-6">
          {(["instagram", "youtube", "tiktok"] as const).map((platform) => (
            <button
              key={platform}
              onClick={() => setSelectedPlatform(platform)}
              className={`px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl font-semibold transition-all text-sm sm:text-base flex items-center gap-2 ${
                selectedPlatform === platform
                  ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              <span className="text-lg sm:text-xl">{platformIcons[platform]}</span>
              {platformNames[platform]}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 sm:p-6 rounded-xl sm:rounded-2xl border border-blue-200 shadow-sm">
            <div className="flex items-center gap-2 sm:gap-3 mb-2">
              <span className="text-2xl sm:text-3xl">👥</span>
              <p className="text-xs font-bold text-blue-600 uppercase tracking-wide">Total Followers</p>
            </div>
            <p className="text-2xl sm:text-3xl lg:text-4xl font-bold text-blue-700">{platformMetrics.totalFollowers.toLocaleString()}</p>
          </div>
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 sm:p-6 rounded-xl sm:rounded-2xl border border-purple-200 shadow-sm">
            <div className="flex items-center gap-2 sm:gap-3 mb-2">
              <span className="text-2xl sm:text-3xl">📈</span>
              <p className="text-xs font-bold text-purple-600 uppercase tracking-wide">Engagement Rate</p>
            </div>
            <p className="text-2xl sm:text-3xl lg:text-4xl font-bold text-purple-700">{platformMetrics.engagementRate.toFixed(1)}%</p>
          </div>
        </div>

        <div className="mb-4 sm:mb-6">
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-4">
            <button
              onClick={() => setSelectedMetric("followers")}
              className={`px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl font-semibold transition-all text-sm sm:text-base ${
                selectedMetric === "followers"
                  ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Followers Growth
            </button>
            <button
              onClick={() => setSelectedMetric("engagement")}
              className={`px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl font-semibold transition-all text-sm sm:text-base ${
                selectedMetric === "engagement"
                  ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Engagement Growth
            </button>
          </div>

          <div className="bg-gradient-to-br from-gray-50 to-white p-4 sm:p-6 rounded-xl sm:rounded-2xl border border-gray-200">
            <h3 className="text-base sm:text-lg font-bold text-gray-800 mb-3 sm:mb-4">
              {platformNames[selectedPlatform]} - {selectedMetric === "followers" ? "Followers Count Month on Month" : "Engagement Growth Month on Month"}
            </h3>
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey={selectedMetric === "followers" ? "followers" : "growth"}
                  stroke="#4F46E5"
                  strokeWidth={3}
                  dot={{ r: 5 }}
                  activeDot={{ r: 8 }}
                  name={selectedMetric === "followers" ? "Followers" : "Engagement Growth (%)"}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

