"use client";

import { useState } from "react";
import type { Brand } from "@/types";

interface CreateBrandFormProps {
  onSubmit: (data: Omit<Brand, "id" | "createdAt">) => void;
  onCancel: () => void;
}

export default function CreateBrandForm({ onSubmit, onCancel }: CreateBrandFormProps) {
  const [formData, setFormData] = useState({
    name: "",
    poc: "",
    email: "",
    contactNumber: "",
    instagramLink: "",
    instagramHandle: "",
    youtubeLink: "",
    youtubeHandle: "",
    tiktokLink: "",
    tiktokHandle: "",
  });

  const extractInstagramHandle = (url: string): string => {
    if (!url) return "";
    // Extract handle from various Instagram URL formats
    const patterns = [
      /instagram\.com\/([a-zA-Z0-9._]+)/,
      /@([a-zA-Z0-9._]+)/,
    ];
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1].replace(/^@/, "");
    }
    return url.replace(/^@/, "").replace(/^https?:\/\//, "").replace(/instagram\.com\//, "");
  };

  const extractYouTubeHandle = (url: string): string => {
    if (!url) return "";
    // Extract handle from various YouTube URL formats
    const patterns = [
      /youtube\.com\/(?:c\/|channel\/|user\/|@)?([a-zA-Z0-9_-]+)/,
      /youtu\.be\/([a-zA-Z0-9_-]+)/,
    ];
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1].replace(/^@/, "");
    }
    return url.replace(/^@/, "").replace(/^https?:\/\//, "").replace(/youtube\.com\//, "");
  };

  const extractTikTokHandle = (url: string): string => {
    if (!url) return "";
    // Extract handle from various TikTok URL formats
    const patterns = [
      /tiktok\.com\/@([a-zA-Z0-9._]+)/,
      /@([a-zA-Z0-9._]+)/,
    ];
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1].replace(/^@/, "");
    }
    return url.replace(/^@/, "").replace(/^https?:\/\//, "").replace(/tiktok\.com\//, "");
  };

  const handleInstagramLinkChange = (url: string) => {
    const handle = extractInstagramHandle(url);
    setFormData({ ...formData, instagramLink: url, instagramHandle: handle });
  };

  const handleYouTubeLinkChange = (url: string) => {
    const handle = extractYouTubeHandle(url);
    setFormData({ ...formData, youtubeLink: url, youtubeHandle: handle });
  };

  const handleTikTokLinkChange = (url: string) => {
    const handle = extractTikTokHandle(url);
    setFormData({ ...formData, tiktokLink: url, tiktokHandle: handle });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
    setFormData({
      name: "",
      poc: "",
      email: "",
      contactNumber: "",
      instagramLink: "",
      instagramHandle: "",
      youtubeLink: "",
      youtubeHandle: "",
      tiktokLink: "",
      tiktokHandle: "",
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Brand Name <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all bg-white/50 backdrop-blur-sm"
          placeholder="Enter brand name"
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Brand POC <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={formData.poc}
          onChange={(e) => setFormData({ ...formData, poc: e.target.value })}
          required
          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all bg-white/50 backdrop-blur-sm"
          placeholder="Enter point of contact name"
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Brand Email ID <span className="text-red-500">*</span>
        </label>
        <input
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          required
          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all bg-white/50 backdrop-blur-sm"
          placeholder="brand@example.com"
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Brand Contact Number <span className="text-red-500">*</span>
        </label>
        <input
          type="tel"
          value={formData.contactNumber}
          onChange={(e) => setFormData({ ...formData, contactNumber: e.target.value })}
          required
          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all bg-white/50 backdrop-blur-sm"
          placeholder="+1 (555) 000-0000"
        />
      </div>

      <div className="border-t border-gray-200 pt-6 mt-6">
        <h3 className="text-lg font-bold text-gray-800 mb-4">Social Media Links</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Instagram Page Link
            </label>
            <input
              type="url"
              value={formData.instagramLink}
              onChange={(e) => handleInstagramLinkChange(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all bg-white/50 backdrop-blur-sm"
              placeholder="https://instagram.com/username"
            />
            {formData.instagramHandle && (
              <p className="mt-2 text-sm text-indigo-600 font-semibold flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Handle: @{formData.instagramHandle}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              YouTube Page Link
            </label>
            <input
              type="url"
              value={formData.youtubeLink}
              onChange={(e) => handleYouTubeLinkChange(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all bg-white/50 backdrop-blur-sm"
              placeholder="https://youtube.com/@channel or https://youtube.com/c/channel"
            />
            {formData.youtubeHandle && (
              <p className="mt-2 text-sm text-indigo-600 font-semibold flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Handle: @{formData.youtubeHandle}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              TikTok Page Link
            </label>
            <input
              type="url"
              value={formData.tiktokLink}
              onChange={(e) => handleTikTokLinkChange(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all bg-white/50 backdrop-blur-sm"
              placeholder="https://tiktok.com/@username"
            />
            {formData.tiktokHandle && (
              <p className="mt-2 text-sm text-indigo-600 font-semibold flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Handle: @{formData.tiktokHandle}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="flex gap-4 pt-4">
        <button
          type="submit"
          className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3.5 px-6 rounded-xl font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98]"
        >
          Create Brand
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 bg-gray-100 text-gray-700 py-3.5 px-6 rounded-xl font-semibold hover:bg-gray-200 transition-all duration-200"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

