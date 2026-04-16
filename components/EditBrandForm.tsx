"use client";

import { useState, useEffect } from "react";
import type { Brand } from "@/types";
import { api } from "@/lib/api";

interface EditBrandFormProps {
  brand: Brand;
  onSaved: (updated: Brand) => void;
  onCancel: () => void;
}

export default function EditBrandForm({ brand, onSaved, onCancel }: EditBrandFormProps) {
  const [formData, setFormData] = useState({
    name: brand.name,
    poc: brand.poc,
    email: brand.email,
    contactNumber: brand.contactNumber,
    contentBuckets:
      brand.contentBuckets && brand.contentBuckets.length > 0
        ? brand.contentBuckets
        : brand.contentBucket
        ? [brand.contentBucket]
        : [""],
    instagramLink: brand.instagramLink ?? "",
    instagramHandle: brand.instagramHandle ?? "",
    youtubeLink: brand.youtubeLink ?? "",
    youtubeHandle: brand.youtubeHandle ?? "",
    tiktokLink: brand.tiktokLink ?? "",
    tiktokHandle: brand.tiktokHandle ?? "",
  });

  const [portalEmail, setPortalEmail] = useState("");
  const [portalPassword, setPortalPassword] = useState("");
  const [inviteBusy, setInviteBusy] = useState(false);
  const [inviteMsg, setInviteMsg] = useState<string | null>(null);

  useEffect(() => {
    setFormData({
      name: brand.name,
      poc: brand.poc,
      email: brand.email,
      contactNumber: brand.contactNumber,
      contentBuckets:
        brand.contentBuckets && brand.contentBuckets.length > 0
          ? brand.contentBuckets
          : brand.contentBucket
          ? [brand.contentBucket]
          : [""],
      instagramLink: brand.instagramLink ?? "",
      instagramHandle: brand.instagramHandle ?? "",
      youtubeLink: brand.youtubeLink ?? "",
      youtubeHandle: brand.youtubeHandle ?? "",
      tiktokLink: brand.tiktokLink ?? "",
      tiktokHandle: brand.tiktokHandle ?? "",
    });
  }, [brand]);

  const extractInstagramHandle = (url: string): string => {
    if (!url) return "";
    const patterns = [/instagram\.com\/([a-zA-Z0-9._]+)/, /@([a-zA-Z0-9._]+)/];
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1].replace(/^@/, "");
    }
    return url.replace(/^@/, "").replace(/^https?:\/\//, "").replace(/instagram\.com\//, "");
  };

  const extractYouTubeHandle = (url: string): string => {
    if (!url) return "";
    const patterns = [/youtube\.com\/(?:c\/|channel\/|user\/|@)?([a-zA-Z0-9_-]+)/, /youtu\.be\/([a-zA-Z0-9_-]+)/];
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1].replace(/^@/, "");
    }
    return url.replace(/^@/, "").replace(/^https?:\/\//, "").replace(/youtube\.com\//, "");
  };

  const extractTikTokHandle = (url: string): string => {
    if (!url) return "";
    const patterns = [/tiktok\.com\/@([a-zA-Z0-9._]+)/, /@([a-zA-Z0-9._]+)/];
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1].replace(/^@/, "");
    }
    return url.replace(/^@/, "").replace(/^https?:\/\//, "").replace(/tiktok\.com\//, "");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const updated = await api.patch<Brand>(`/api/brands/${brand.id}`, {
      name: formData.name,
      poc: formData.poc,
      email: formData.email,
      contactNumber: formData.contactNumber,
      contentBuckets: formData.contentBuckets.map((b) => b.trim()).filter(Boolean),
      contentBucket: formData.contentBuckets.map((b) => b.trim()).filter(Boolean)[0] || undefined,
      instagramLink: formData.instagramLink || undefined,
      instagramHandle: formData.instagramHandle || undefined,
      youtubeLink: formData.youtubeLink || undefined,
      youtubeHandle: formData.youtubeHandle || undefined,
      tiktokLink: formData.tiktokLink || undefined,
      tiktokHandle: formData.tiktokHandle || undefined,
    });
    onSaved(updated);
  };

  const handleCreatePortalLogin = async () => {
    const e = portalEmail.trim();
    const p = portalPassword.trim();
    if (!e || !p) {
      setInviteMsg("Enter both email and password for the brand login.");
      return;
    }
    setInviteBusy(true);
    setInviteMsg(null);
    try {
      await api.post(`/api/brands/${brand.id}/brand-users`, {
        email: e,
        password: p,
        name: formData.poc,
      });
      setInviteMsg("Brand login created. They can sign in on the login page with Brand selected.");
      setPortalPassword("");
    } catch (err) {
      setInviteMsg(err instanceof Error ? err.message : "Failed to create login");
    } finally {
      setInviteBusy(false);
    }
  };

  return (
    <div className="space-y-6 max-h-[80vh] overflow-y-auto pr-1">
      <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
        <div>
          <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-2">
            Brand Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(ev) => setFormData({ ...formData, name: ev.target.value })}
            required
            className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none bg-white text-sm sm:text-base"
          />
        </div>

        <div>
          <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-2">Brand POC *</label>
          <input
            type="text"
            value={formData.poc}
            onChange={(ev) => setFormData({ ...formData, poc: ev.target.value })}
            required
            className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none bg-white text-sm sm:text-base"
          />
        </div>

        <div>
          <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-2">Brand Email *</label>
          <input
            type="email"
            value={formData.email}
            onChange={(ev) => setFormData({ ...formData, email: ev.target.value })}
            required
            className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none bg-white text-sm sm:text-base"
          />
        </div>

        <div>
          <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-2">Contact Number *</label>
          <input
            type="tel"
            value={formData.contactNumber}
            onChange={(ev) => setFormData({ ...formData, contactNumber: ev.target.value })}
            required
            className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none bg-white text-sm sm:text-base"
          />
        </div>

        <div>
          <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-2">
            Content Buckets
          </label>
          <div className="space-y-2">
            {formData.contentBuckets.map((bucket, idx) => (
              <div key={idx} className="flex gap-2">
                <input
                  type="text"
                  value={bucket}
                  onChange={(ev) => {
                    const next = [...formData.contentBuckets];
                    next[idx] = ev.target.value;
                    setFormData({ ...formData, contentBuckets: next });
                  }}
                  className="flex-1 px-3 sm:px-4 py-2.5 sm:py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none bg-white text-sm sm:text-base"
                  placeholder="e.g. Q2 Campaign Assets"
                />
                {formData.contentBuckets.length > 1 && (
                  <button
                    type="button"
                    onClick={() =>
                      setFormData({
                        ...formData,
                        contentBuckets: formData.contentBuckets.filter((_, i) => i !== idx),
                      })
                    }
                    className="px-3 py-2 rounded-lg bg-red-100 text-red-700 text-xs font-semibold hover:bg-red-200"
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={() =>
                setFormData({
                  ...formData,
                  contentBuckets: [...formData.contentBuckets, ""],
                })
              }
              className="px-3 py-2 rounded-lg bg-indigo-100 text-indigo-700 text-xs font-semibold hover:bg-indigo-200"
            >
              + Add bucket
            </button>
          </div>
        </div>

        <div className="border-t border-gray-200 pt-4">
          <h3 className="text-base font-bold text-gray-800 mb-3">Social links</h3>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Instagram</label>
              <input
                type="url"
                value={formData.instagramLink}
                onChange={(ev) => {
                  const url = ev.target.value;
                  setFormData({
                    ...formData,
                    instagramLink: url,
                    instagramHandle: extractInstagramHandle(url),
                  });
                }}
                className="w-full px-3 py-2 border-2 border-gray-200 rounded-xl text-sm"
                placeholder="https://instagram.com/..."
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">YouTube</label>
              <input
                type="url"
                value={formData.youtubeLink}
                onChange={(ev) => {
                  const url = ev.target.value;
                  setFormData({
                    ...formData,
                    youtubeLink: url,
                    youtubeHandle: extractYouTubeHandle(url),
                  });
                }}
                className="w-full px-3 py-2 border-2 border-gray-200 rounded-xl text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">TikTok</label>
              <input
                type="url"
                value={formData.tiktokLink}
                onChange={(ev) => {
                  const url = ev.target.value;
                  setFormData({
                    ...formData,
                    tiktokLink: url,
                    tiktokHandle: extractTikTokHandle(url),
                  });
                }}
                className="w-full px-3 py-2 border-2 border-gray-200 rounded-xl text-sm"
              />
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <button
            type="submit"
            className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 rounded-xl font-semibold hover:from-indigo-700 hover:to-purple-700 shadow-lg text-sm sm:text-base"
          >
            Save changes
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-200 text-sm sm:text-base"
          >
            Cancel
          </button>
        </div>
      </form>

      <div className="border-t border-gray-200 pt-4 space-y-3">
        <h3 className="text-base font-bold text-gray-800">Brand dashboard login</h3>
        <p className="text-sm text-gray-600">
          Creating a brand does not automatically create a login. Add credentials here so the brand can sign in (choose <strong>Brand Login</strong> on the login page).
        </p>
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">Login email</label>
          <input
            type="email"
            value={portalEmail}
            onChange={(ev) => setPortalEmail(ev.target.value)}
            className="w-full px-3 py-2 border-2 border-gray-200 rounded-xl text-sm"
            placeholder={formData.email || "brand-user@example.com"}
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">Password (min 6 characters)</label>
          <input
            type="password"
            value={portalPassword}
            onChange={(ev) => setPortalPassword(ev.target.value)}
            className="w-full px-3 py-2 border-2 border-gray-200 rounded-xl text-sm"
            autoComplete="new-password"
          />
        </div>
        <button
          type="button"
          disabled={inviteBusy}
          onClick={handleCreatePortalLogin}
          className="w-full py-2.5 rounded-xl font-semibold bg-slate-800 text-white hover:bg-slate-900 disabled:opacity-60 text-sm"
        >
          {inviteBusy ? "Creating…" : "Create brand login"}
        </button>
        {inviteMsg && <p className="text-sm text-indigo-700 font-medium">{inviteMsg}</p>}
      </div>
    </div>
  );
}
