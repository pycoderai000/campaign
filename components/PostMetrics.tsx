"use client";

import { useState } from "react";
import MetricsChart from "./MetricsChart";
import type { Deliverable, PostMetrics } from "@/types";

interface PostMetricsProps {
  deliverable: Deliverable;
}

export default function PostMetrics({ deliverable }: PostMetricsProps) {
  // Mock post-level metrics - replace with actual API calls
  const mockMetrics: PostMetrics[] = [];
  const today = new Date();
  
  for (let i = 0; i < 30; i += 3) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    
    const impressions = 1000 + Math.random() * 5000;
    const reach = impressions * (0.6 + Math.random() * 0.3);
    const likes = reach * (0.1 + Math.random() * 0.2);
    const comments = likes * (0.05 + Math.random() * 0.1);
    const engagement = likes + comments * 2;
    
    mockMetrics.push({
      postId: deliverable.id,
      impressions: Math.round(impressions),
      reach: Math.round(reach),
      likes: Math.round(likes),
      comments: Math.round(comments),
      engagement: Math.round(engagement),
      date: date.toISOString(),
    });
  }
  
  const sortedMetrics = mockMetrics.sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  const latestMetrics = sortedMetrics[sortedMetrics.length - 1] || {
    impressions: 0,
    reach: 0,
    likes: 0,
    comments: 0,
    engagement: 0,
  };

  const [selectedMetric, setSelectedMetric] = useState<"impressions" | "reach" | "engagement">(
    "impressions"
  );

  const chartData = sortedMetrics.map((metric) => ({
    date: metric.date,
    value:
      selectedMetric === "impressions"
        ? metric.impressions
        : selectedMetric === "reach"
        ? metric.reach
        : metric.engagement,
  }));

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-blue-50 p-4 rounded-lg">
          <p className="text-sm text-gray-600 mb-1">Impressions</p>
          <p className="text-2xl font-bold text-blue-700">
            {latestMetrics.impressions.toLocaleString()}
          </p>
        </div>
        <div className="bg-green-50 p-4 rounded-lg">
          <p className="text-sm text-gray-600 mb-1">Reach</p>
          <p className="text-2xl font-bold text-green-700">
            {latestMetrics.reach.toLocaleString()}
          </p>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg">
          <p className="text-sm text-gray-600 mb-1">Likes</p>
          <p className="text-2xl font-bold text-purple-700">
            {latestMetrics.likes.toLocaleString()}
          </p>
        </div>
        <div className="bg-yellow-50 p-4 rounded-lg">
          <p className="text-sm text-gray-600 mb-1">Comments</p>
          <p className="text-2xl font-bold text-yellow-700">
            {latestMetrics.comments.toLocaleString()}
          </p>
        </div>
        <div className="bg-indigo-50 p-4 rounded-lg">
          <p className="text-sm text-gray-600 mb-1">Engagement</p>
          <p className="text-2xl font-bold text-indigo-700">
            {latestMetrics.engagement.toLocaleString()}
          </p>
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg shadow">
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Metric
          </label>
          <select
            value={selectedMetric}
            onChange={(e) =>
              setSelectedMetric(e.target.value as "impressions" | "reach" | "engagement")
            }
            className="w-full md:w-auto px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
          >
            <option value="impressions">Impressions</option>
            <option value="reach">Reach</option>
            <option value="engagement">Engagement</option>
          </select>
        </div>
        <MetricsChart data={chartData} metricType={selectedMetric} />
      </div>
    </div>
  );
}

