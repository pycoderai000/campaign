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
  const [selectedMetric, setSelectedMetric] = useState<"followers" | "engagement">("followers");

  const followersData = metrics.followers.map((f) => ({
    month: f.month,
    followers: f.count,
  }));

  const engagementData = metrics.engagementGrowth.map((e) => ({
    month: e.month,
    growth: e.growth,
  }));

  const chartData = selectedMetric === "followers" ? followersData : engagementData;

  return (
    <div className="space-y-6">
      <div className="bg-white/80 backdrop-blur-sm p-8 rounded-2xl shadow-soft border border-gray-200">
        <div className="mb-6">
          <h2 className="text-3xl font-bold text-slate-800 mb-2">Social Media Metrics</h2>
          <p className="text-gray-600">Track your social media performance</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-2xl border border-blue-200 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-3xl">👥</span>
              <p className="text-xs font-bold text-blue-600 uppercase tracking-wide">Total Followers</p>
            </div>
            <p className="text-4xl font-bold text-blue-700">{metrics.totalFollowers.toLocaleString()}</p>
          </div>
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-2xl border border-purple-200 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-3xl">📈</span>
              <p className="text-xs font-bold text-purple-600 uppercase tracking-wide">Engagement Rate</p>
            </div>
            <p className="text-4xl font-bold text-purple-700">{metrics.engagementRate.toFixed(1)}%</p>
          </div>
        </div>

        <div className="mb-6">
          <div className="flex gap-4 mb-4">
            <button
              onClick={() => setSelectedMetric("followers")}
              className={`px-6 py-3 rounded-xl font-semibold transition-all ${
                selectedMetric === "followers"
                  ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Followers Growth
            </button>
            <button
              onClick={() => setSelectedMetric("engagement")}
              className={`px-6 py-3 rounded-xl font-semibold transition-all ${
                selectedMetric === "engagement"
                  ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Engagement Growth
            </button>
          </div>

          <div className="bg-gradient-to-br from-gray-50 to-white p-6 rounded-2xl border border-gray-200">
            <h3 className="text-lg font-bold text-gray-800 mb-4">
              {selectedMetric === "followers" ? "Followers Count Month on Month" : "Engagement Growth Month on Month"}
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

