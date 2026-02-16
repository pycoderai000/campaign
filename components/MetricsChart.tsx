"use client";

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

interface MetricsChartProps {
  data: { date: string; value: number }[];
  metricType: "impressions" | "reach" | "engagement";
}

export default function MetricsChart({ data, metricType }: MetricsChartProps) {
  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  const formatValue = (value: number) => {
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
    return value.toString();
  };

  const chartData = data.map((item) => ({
    date: formatDate(item.date),
    [metricType]: item.value,
  }));

  return (
    <div className="w-full h-64 sm:h-72 lg:h-80 bg-white p-3 sm:p-4 rounded-lg shadow">
      <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 capitalize">
        {metricType} Over Time
      </h3>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis tickFormatter={formatValue} />
          <Tooltip
            formatter={(value: number) => formatValue(value)}
            labelStyle={{ color: "#374151" }}
          />
          <Legend />
          <Line
            type="monotone"
            dataKey={metricType}
            stroke="#4F46E5"
            strokeWidth={2}
            dot={{ r: 4 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

