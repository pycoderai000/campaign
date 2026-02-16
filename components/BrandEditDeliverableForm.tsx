"use client";

import { useState } from "react";
import type { Deliverable, DeliverableStatus } from "@/types";

interface BrandEditDeliverableFormProps {
  deliverable: Deliverable;
  onSubmit: (data: Partial<Deliverable> & { revisionNote?: string; newFiles?: File[] }) => void;
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
    revisionNote: "",
    newFiles: [] as File[],
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFormData({
        ...formData,
        newFiles: Array.from(e.target.files),
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...deliverable,
      caption: formData.caption,
      postingDate: formData.postingDate,
      postingTime: formData.postingTime,
      status: formData.status,
      revisionNote: formData.revisionNote,
      newFiles: formData.newFiles,
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

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Request Revision <span className="text-gray-500 text-xs">(Upload new content files)</span>
        </label>
        <input
          type="file"
          onChange={handleFileChange}
          multiple={deliverable.postType === "Carousel"}
          accept="image/*,video/*"
          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all bg-white/50 backdrop-blur-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
        />
        {formData.newFiles.length > 0 && (
          <p className="mt-2 text-sm text-indigo-600 font-semibold flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {formData.newFiles.length} file(s) selected for revision
          </p>
        )}
      </div>

      {formData.newFiles.length > 0 && (
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Revision Note <span className="text-red-500">*</span>
          </label>
          <textarea
            value={formData.revisionNote}
            onChange={(e) => setFormData({ ...formData, revisionNote: e.target.value })}
            required={formData.newFiles.length > 0}
            rows={3}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all bg-white/50 backdrop-blur-sm resize-none"
            placeholder="Explain what needs to be revised..."
          />
        </div>
      )}

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

