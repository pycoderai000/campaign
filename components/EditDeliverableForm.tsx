"use client";

import { useState, useEffect } from "react";
import type { Deliverable, PostType, DeliverableStatus } from "@/types";

interface EditDeliverableFormProps {
  deliverable: Deliverable;
  onSubmit: (data: Deliverable) => void;
  onCancel: () => void;
}

const postTypes: PostType[] = ["Static", "Carousel", "Video post"];
const statuses: DeliverableStatus[] = [
  "New content",
  "In revision",
  "Approved",
  "Live",
  "Cancelled",
];

export default function EditDeliverableForm({
  deliverable,
  onSubmit,
  onCancel,
}: EditDeliverableFormProps) {
  const [formData, setFormData] = useState({
    name: deliverable.name,
    postType: deliverable.postType,
    files: deliverable.files,
    caption: deliverable.caption,
    postingDate: deliverable.postingDate,
    postingTime: deliverable.postingTime,
    liveLink: deliverable.liveLink || "",
    status: deliverable.status,
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFormData({
        ...formData,
        files: Array.from(e.target.files),
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...deliverable,
      ...formData,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
      <div>
        <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-2">
          Deliverable Name <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
          className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all bg-white/50 backdrop-blur-sm text-sm sm:text-base"
        />
      </div>

      <div>
        <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-2">
          Post Type <span className="text-red-500">*</span>
        </label>
        <select
          value={formData.postType}
          onChange={(e) => {
            const newPostType = e.target.value as PostType;
            // If switching to/from Carousel, reset files
            if ((newPostType === "Carousel") !== (formData.postType === "Carousel")) {
              setFormData({ ...formData, postType: newPostType, files: [] });
            } else {
              setFormData({ ...formData, postType: newPostType });
            }
          }}
          required
          className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all bg-white/50 backdrop-blur-sm appearance-none cursor-pointer text-sm sm:text-base"
        >
          {postTypes.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-2">
          File Upload <span className="text-gray-500 text-xs">(Video, Single Image, or Multiple Images)</span>
        </label>
        <input
          type="file"
          onChange={handleFileChange}
          multiple={formData.postType === "Carousel"}
          accept="image/*,video/*"
          key={`${formData.postType}-${formData.files.length}`}
          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all bg-white/50 backdrop-blur-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
        />
        {formData.files.length > 0 && (
          <p className="mt-2 text-sm text-indigo-600 font-semibold flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {formData.files.length} file(s) selected
          </p>
        )}
      </div>

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
        <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-2">
          Add Live Link
        </label>
        <input
          type="url"
          value={formData.liveLink}
          onChange={(e) => setFormData({ ...formData, liveLink: e.target.value })}
          className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all bg-white/50 backdrop-blur-sm text-sm sm:text-base"
          placeholder="https://..."
        />
      </div>

      <div>
        <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-2">
          Status <span className="text-red-500">*</span>
        </label>
        <select
          value={formData.status}
          onChange={(e) => setFormData({ ...formData, status: e.target.value as DeliverableStatus })}
          required
          className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all bg-white/50 backdrop-blur-sm appearance-none cursor-pointer text-sm sm:text-base"
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

