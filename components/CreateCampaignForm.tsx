"use client";

import { useState } from "react";
import type { Campaign, CampaignType } from "@/types";

interface CreateCampaignFormProps {
  brands: { id: string; name: string }[];
  onSubmit: (data: Omit<Campaign, "id" | "createdAt">) => void;
  onCancel: () => void;
}

const campaignTypes: CampaignType[] = ["LinkedIn", "Instagram", "YouTube", "TikTok"];

export default function CreateCampaignForm({
  brands,
  onSubmit,
  onCancel,
}: CreateCampaignFormProps) {
  const [formData, setFormData] = useState({
    name: "",
    type: "LinkedIn" as CampaignType,
    brandId: brands.length > 0 ? brands[0].id : "",
    brandName: brands.length > 0 ? brands[0].name : "",
  });

  const handleBrandChange = (brandId: string) => {
    const selectedBrand = brands.find((b) => b.id === brandId);
    setFormData({
      ...formData,
      brandId,
      brandName: selectedBrand?.name || "",
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.brandId || brands.length === 0) {
      alert("Please select a brand");
      return;
    }
    onSubmit(formData);
    setFormData({
      name: "",
      type: "LinkedIn",
      brandId: brands.length > 0 ? brands[0].id : "",
      brandName: brands.length > 0 ? brands[0].name : "",
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
      <div>
        <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-2">
          Campaign Name <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
          className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all bg-white/50 backdrop-blur-sm text-sm sm:text-base"
          placeholder="Enter campaign name"
        />
      </div>

      <div>
        <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-2">
          Campaign Type <span className="text-red-500">*</span>
        </label>
        <select
          value={formData.type}
          onChange={(e) => setFormData({ ...formData, type: e.target.value as CampaignType })}
          required
          className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all bg-white/50 backdrop-blur-sm appearance-none cursor-pointer text-sm sm:text-base"
        >
          {campaignTypes.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-2">
          Brand Name <span className="text-red-500">*</span>
        </label>
        <select
          value={formData.brandId}
          onChange={(e) => handleBrandChange(e.target.value)}
          required
          className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all bg-white/50 backdrop-blur-sm appearance-none cursor-pointer text-sm sm:text-base"
        >
          {brands.map((brand) => (
            <option key={brand.id} value={brand.id}>
              {brand.name}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-4">
        <button
          type="submit"
          className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 sm:py-3.5 px-4 sm:px-6 rounded-xl font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98] text-sm sm:text-base"
        >
          Create Campaign
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

