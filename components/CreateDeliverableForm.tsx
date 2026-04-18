"use client";

import { useState } from "react";
import type { Deliverable, PostType, DeliverableStatus } from "@/types";

interface CreateDeliverableFormProps {
  campaigns: { id: string; name: string; brandId: string; brandName: string }[];
  brands: { id: string; name: string }[];
  onSubmit: (data: Omit<Deliverable, "id" | "createdAt" | "comments">) => void;
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

export default function CreateDeliverableForm({
  campaigns,
  brands,
  onSubmit,
  onCancel,
}: CreateDeliverableFormProps) {
  const [formData, setFormData] = useState({
    name: "",
    postType: "Static" as PostType,
    files: [] as File[],
    caption: "",
    postingDate: "",
    postingTime: "",
    campaignId: campaigns[0]?.id || "",
    campaignName: campaigns[0]?.name || "",
    brandId: campaigns[0]?.brandId || "",
    brandName: campaigns[0]?.brandName || "",
    status: "New content" as DeliverableStatus,
  });

  const handleCampaignChange = (campaignId: string) => {
    const selectedCampaign = campaigns.find((c) => c.id === campaignId);
    setFormData({
      ...formData,
      campaignId,
      campaignName: selectedCampaign?.name || "",
      brandId: selectedCampaign?.brandId || "",
      brandName: selectedCampaign?.brandName || "",
    });
  };

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
    if (!formData.campaignId || campaigns.length === 0) {
      alert("Please select a campaign");
      return;
    }
    if (formData.files.length === 0) {
      alert("Please upload at least one file");
      return;
    }
    onSubmit(formData);
    setFormData({
      name: "",
      postType: "Static",
      files: [],
      caption: "",
      postingDate: "",
      postingTime: "",
      campaignId: campaigns.length > 0 ? campaigns[0].id : "",
      campaignName: campaigns.length > 0 ? campaigns[0].name : "",
      brandId: campaigns.length > 0 ? campaigns[0].brandId : "",
      brandName: campaigns.length > 0 ? campaigns[0].brandName : "",
      status: "New content",
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
          placeholder="Enter deliverable name"
        />
      </div>

      <div>
        <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-2">
          Post Type <span className="text-red-500">*</span>
        </label>
        <select
          value={formData.postType}
          onChange={(e) => {
            setFormData({ ...formData, postType: e.target.value as PostType, files: [] });
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
          File Upload <span className="text-red-500">*</span> <span className="text-gray-500 text-xs">(Video, Single Image, or Multiple Images)</span>
        </label>
        <div className="relative">
          <input
            type="file"
            onChange={handleFileChange}
            required
            multiple={
              formData.postType === "Carousel" || formData.postType === "Static"
            }
            accept="image/*,video/*"
            key={formData.postType}
            className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all bg-white/50 backdrop-blur-sm file:mr-2 sm:file:mr-4 file:py-1.5 sm:file:py-2 file:px-2 sm:file:px-4 file:rounded-lg file:border-0 file:text-xs sm:file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 text-sm sm:text-base"
          />
        </div>
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
          rows={8}
          className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all bg-white/50 backdrop-blur-sm resize-y min-h-[12rem] text-sm sm:text-base"
          placeholder="Enter caption"
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
          Campaign Name <span className="text-gray-500 text-xs">(Auto-filled)</span>
        </label>
        <select
          value={formData.campaignId}
          onChange={(e) => handleCampaignChange(e.target.value)}
          required
          className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border-2 border-gray-200 rounded-xl bg-gray-50 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all appearance-none cursor-pointer text-sm sm:text-base"
        >
          {campaigns.map((campaign) => (
            <option key={campaign.id} value={campaign.id}>
              {campaign.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-2">
          Brand Name <span className="text-gray-500 text-xs">(Auto-filled)</span>
        </label>
        <input
          type="text"
          value={formData.brandName}
          disabled
          className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border-2 border-gray-200 rounded-xl bg-gray-50 text-gray-600 text-sm sm:text-base"
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
          Create Deliverable
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

