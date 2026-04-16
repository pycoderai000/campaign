"use client";

import { useState } from "react";
import type { Deliverable } from "@/types";

interface BrandRequestRevisionFormProps {
  deliverable: Deliverable;
  onSubmit: (data: { revisionNote: string; newFiles?: File[]; caption?: string }) => void;
  onCancel: () => void;
}

export default function BrandRequestRevisionForm({
  deliverable,
  onSubmit,
  onCancel,
}: BrandRequestRevisionFormProps) {
  const [revisionNote, setRevisionNote] = useState("");
  const [caption, setCaption] = useState(deliverable.caption ?? "");
  const [newFiles, setNewFiles] = useState<File[]>([]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setNewFiles(Array.from(e.target.files));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const note = revisionNote.trim();
    if (!note) return;
    const newCaption = caption.trim();
    onSubmit({
      revisionNote: note,
      newFiles: newFiles.length ? newFiles : undefined,
      caption: newCaption,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
      <p className="text-sm text-gray-600">
        Describe what should change. The team will review your revision request. You can optionally attach replacement files.
      </p>

      <div>
        <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-2">
          Caption
        </label>
        <textarea
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          rows={4}
          className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all bg-white/50 backdrop-blur-sm resize-none text-sm sm:text-base"
          placeholder="Caption (optional update while requesting revision)"
        />
      </div>

      <div>
        <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-2">
          Revision notes <span className="text-red-500">*</span>
        </label>
        <textarea
          value={revisionNote}
          onChange={(e) => setRevisionNote(e.target.value)}
          required
          rows={5}
          className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all bg-white/50 backdrop-blur-sm resize-none text-sm sm:text-base"
          placeholder="e.g. Update headline, swap image 2 for product shot, tone down caption…"
        />
      </div>

      <div>
        <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-2">
          Attach files <span className="text-gray-500 font-normal">(optional)</span>
        </label>
        <input
          type="file"
          onChange={handleFileChange}
          multiple={
            deliverable.postType === "Carousel" ||
            deliverable.postType === "Static"
          }
          accept="image/*,video/*"
          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all bg-white/50 backdrop-blur-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
        />
        {newFiles.length > 0 && (
          <p className="mt-2 text-sm text-indigo-600 font-semibold">
            {newFiles.length} file(s) selected
          </p>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-4">
        <button
          type="submit"
          className="flex-1 bg-gradient-to-r from-amber-600 to-orange-600 text-white py-3 sm:py-3.5 px-4 sm:px-6 rounded-xl font-semibold hover:from-amber-700 hover:to-orange-700 transition-all duration-200 shadow-lg text-sm sm:text-base"
        >
          Submit revision request
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
