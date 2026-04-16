"use client";

import { useState } from "react";
import type { Brand } from "@/types";
import Modal from "@/components/Modal";

export type CreateBrandPayload = Omit<Brand, "id" | "createdAt"> & {
  portalLoginEmail?: string;
  portalLoginPassword?: string;
};

interface CreateBrandFormProps {
  onSubmit: (data: CreateBrandPayload) => void;
  onCancel: () => void;
}

export default function CreateBrandForm({ onSubmit, onCancel }: CreateBrandFormProps) {
  const [showCreateVariableModal, setShowCreateVariableModal] = useState(false);
  const [newVariableValue, setNewVariableValue] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    poc: "",
    email: "",
    contactNumber: "",
    contentBuckets: [""],
    instagramLink: "",
    instagramHandle: "",
    youtubeLink: "",
    youtubeHandle: "",
    tiktokLink: "",
    tiktokHandle: "",
    portalLoginEmail: "",
    portalLoginPassword: "",
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
    const contentBuckets = formData.contentBuckets
      .map((b) => b.trim())
      .filter(Boolean);
    onSubmit({
      ...formData,
      contentBuckets,
      contentBucket: contentBuckets[0] || "",
    });
    setFormData({
      name: "",
      poc: "",
      email: "",
      contactNumber: "",
      contentBuckets: [""],
      instagramLink: "",
      instagramHandle: "",
      youtubeLink: "",
      youtubeHandle: "",
      tiktokLink: "",
      tiktokHandle: "",
      portalLoginEmail: "",
      portalLoginPassword: "",
    });
  };

  const addContentBucket = () => {
    const value = newVariableValue.trim();
    if (!value) return;
    const existing = formData.contentBuckets
      .map((b) => b.trim().toLowerCase())
      .filter(Boolean);
    if (existing.includes(value.toLowerCase())) {
      setNewVariableValue("");
      return;
    }
    setFormData((prev) => ({
      ...prev,
      contentBuckets: [...prev.contentBuckets.filter((b) => b.trim().length > 0), value],
    }));
    setNewVariableValue("");
    setShowCreateVariableModal(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
      <div>
        <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-2">
          Brand Name <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
          className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all bg-white/50 backdrop-blur-sm text-sm sm:text-base"
          placeholder="Enter brand name"
        />
      </div>

      <div>
        <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-2">
          Brand POC <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={formData.poc}
          onChange={(e) => setFormData({ ...formData, poc: e.target.value })}
          required
          className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all bg-white/50 backdrop-blur-sm text-sm sm:text-base"
          placeholder="Enter point of contact name"
        />
      </div>

      <div>
        <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-2">
          Brand Email ID <span className="text-red-500">*</span>
        </label>
        <input
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          required
          className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all bg-white/50 backdrop-blur-sm text-sm sm:text-base"
          placeholder="brand@example.com"
        />
      </div>

      <div>
        <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-2">
          Brand Contact Number <span className="text-red-500">*</span>
        </label>
        <input
          type="tel"
          value={formData.contactNumber}
          onChange={(e) => setFormData({ ...formData, contactNumber: e.target.value })}
          required
          className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all bg-white/50 backdrop-blur-sm text-sm sm:text-base"
          placeholder="+1 (555) 000-0000"
        />
      </div>

      <div className="border-t border-gray-200 pt-4 sm:pt-6 mt-4 sm:mt-6">
        <h3 className="text-base sm:text-lg font-bold text-gray-800 mb-3 sm:mb-4">Social Media Links</h3>
        
        <div className="space-y-3 sm:space-y-4">
          <div>
            <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-2">
              Instagram Page Link
            </label>
            <input
              type="url"
              value={formData.instagramLink}
              onChange={(e) => handleInstagramLinkChange(e.target.value)}
              className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all bg-white/50 backdrop-blur-sm text-sm sm:text-base"
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
            <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-2">
              YouTube Page Link
            </label>
            <input
              type="url"
              value={formData.youtubeLink}
              onChange={(e) => handleYouTubeLinkChange(e.target.value)}
              className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all bg-white/50 backdrop-blur-sm text-sm sm:text-base"
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
            <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-2">
              TikTok Page Link
            </label>
            <input
              type="url"
              value={formData.tiktokLink}
              onChange={(e) => handleTikTokLinkChange(e.target.value)}
              className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all bg-white/50 backdrop-blur-sm text-sm sm:text-base"
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

      <div className="border-t border-gray-200 pt-4 sm:pt-6 mt-2">
        <h3 className="text-base sm:text-lg font-bold text-gray-800 mb-2">Brand dashboard login (optional)</h3>
        <p className="text-xs sm:text-sm text-gray-600 mb-3 sm:mb-4">
          To let this brand sign in at the login page, choose <strong>Brand Login</strong> and use the email and password you set below. Leave both empty if you will add login later (Edit brand → Brand dashboard login).
        </p>
        <div className="space-y-3 sm:space-y-4">
          <div>
            <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-2">Portal login email</label>
            <input
              type="email"
              value={formData.portalLoginEmail}
              onChange={(e) => setFormData({ ...formData, portalLoginEmail: e.target.value })}
              className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none bg-white/50 text-sm sm:text-base"
              placeholder="Usually same as brand email above"
            />
          </div>
          <div>
            <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-2">Portal login password</label>
            <input
              type="password"
              value={formData.portalLoginPassword}
              onChange={(e) => setFormData({ ...formData, portalLoginPassword: e.target.value })}
              className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none bg-white/50 text-sm sm:text-base"
              placeholder="Min 6 characters"
              autoComplete="new-password"
            />
          </div>
        </div>
        <div className="mt-4 sm:mt-5">
          <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-2">
            Create Variable <span className="text-gray-500 text-xs">(Content buckets for this brand)</span>
          </label>
          <button
            type="button"
            onClick={() => setShowCreateVariableModal(true)}
            className="px-3 py-2 rounded-lg bg-indigo-100 text-indigo-700 text-xs font-semibold hover:bg-indigo-200"
          >
            + Create
          </button>
          <div className="mt-2 flex flex-wrap gap-2">
            {formData.contentBuckets
              .map((b) => b.trim())
              .filter(Boolean)
              .map((bucket, idx) => (
                <span
                  key={`${bucket}-${idx}`}
                  className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-semibold border border-indigo-200"
                >
                  {bucket}
                  <button
                    type="button"
                    onClick={() =>
                      setFormData((prev) => ({
                        ...prev,
                        contentBuckets: prev.contentBuckets.filter((b) => b.trim() !== bucket),
                      }))
                    }
                    className="text-indigo-700 hover:text-indigo-900"
                    aria-label={`Remove ${bucket}`}
                  >
                    ×
                  </button>
                </span>
              ))}
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-4">
        <button
          type="submit"
          className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 sm:py-3.5 px-4 sm:px-6 rounded-xl font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98] text-sm sm:text-base"
        >
          Create Brand
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 bg-gray-100 text-gray-700 py-3 sm:py-3.5 px-4 sm:px-6 rounded-xl font-semibold hover:bg-gray-200 transition-all duration-200 text-sm sm:text-base"
        >
          Cancel
        </button>
      </div>
      <Modal
        isOpen={showCreateVariableModal}
        onClose={() => {
          setShowCreateVariableModal(false);
          setNewVariableValue("");
        }}
        title="Create Variable"
      >
        <div className="space-y-4">
          <input
            type="text"
            value={newVariableValue}
            onChange={(e) => setNewVariableValue(e.target.value)}
            placeholder="Example: Supply chain, Cold Storage"
            className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all bg-white/50 backdrop-blur-sm text-sm sm:text-base"
          />
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                setShowCreateVariableModal(false);
                setNewVariableValue("");
              }}
              className="px-3 py-2 rounded-lg bg-gray-100 text-gray-700 text-xs font-semibold hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={addContentBucket}
              className="px-3 py-2 rounded-lg bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700"
            >
              Add
            </button>
          </div>
        </div>
      </Modal>
    </form>
  );
}

