"use client";

import { useState } from "react";
import type { Deliverable, DeliverableStatus } from "@/types";

interface BrandEditDeliverableFormProps {
  deliverable: Deliverable;
  onSubmit: (data: Partial<Deliverable>) => void;
  onCancel: () => void;
}

const statuses: DeliverableStatus[] = [
  "New content",
  "In revision",
  "Approved",
  "Live",
  "Cancelled",
];

export default function BrandEditDeliverableForm({
  deliverable,
  onSubmit,
  onCancel,
}: BrandEditDeliverableFormProps) {
  const [formData, setFormData] = useState({
    caption: deliverable.caption,
    postingDate: deliverable.postingDate,
    postingTime: deliverable.postingTime,
    status: deliverable.status,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...deliverable,
      caption: formData.caption,
      postingDate: formData.postingDate,
      postingTime: formData.postingTime,
      status: formData.status,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
      <div>
        <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-2">
          Caption <span className="text-red-500">*</span>
        </label>
        <textarea
          value={formData.caption}
          onChange={(e) => setFormData({ ...formData, caption: e.target.value })}
          required
          rows={4}
          className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all bg-white/50 backdrop-blur-sm resize-none text-sm sm:text-base"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        <div>
          <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-2">
            Posting Date <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            value={formData.postingDate}
            onChange={(e) => setFormData({ ...formData, postingDate: e.target.value })}
            required
            className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all bg-white/50 backdrop-blur-sm text-sm sm:text-base"
          />
        </div>
        <div>
          <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-2">
            Posting Time <span className="text-red-500">*</span>
          </label>
          <input
            type="time"
            value={formData.postingTime}
            onChange={(e) => setFormData({ ...formData, postingTime: e.target.value })}
            required
            className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all bg-white/50 backdrop-blur-sm text-sm sm:text-base"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Status <span className="text-red-500">*</span>
        </label>
        <select
          value={formData.status}
          onChange={(e) => setFormData({ ...formData, status: e.target.value as DeliverableStatus })}
          required
          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all bg-white/50 backdrop-blur-sm appearance-none cursor-pointer"
        >
          {statuses.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-4">
        <button
          type="submit"
          className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 sm:py-3.5 px-4 sm:px-6 rounded-xl font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98] text-sm sm:text-base"
        >
          Update Deliverable
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 bg-gray-100 text-gray-700 py-3 sm:py-3.5 px-4 sm:px-6 rounded-xl font-semibold hover:bg-gray-200 transition-all duration-200 text-sm sm:text-base"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

