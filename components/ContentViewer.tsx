"use client";

import { useState, useMemo, useEffect } from "react";
import type { PostType, ContentVersion, FileOrUrl } from "@/types";
import { getFileDisplayUrl, isImageFileOrUrl, isVideoFileOrUrl } from "@/lib/file-display";

interface ContentViewerProps {
  files: FileOrUrl[];
  postType: PostType;
  contentHistory?: ContentVersion[];
  onViewHistory?: (version: ContentVersion) => void;
}

function filterValidFiles(files: FileOrUrl[]): FileOrUrl[] {
  return files.filter((f) => {
    if (f == null) return false;
    if (typeof f === "string") return f.trim().length > 0;
    return true;
  });
}

function MultiImageCarousel({ images }: { images: FileOrUrl[] }) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [imgError, setImgError] = useState(false);

  const getFileUrl = (file: FileOrUrl): string => {
    if (typeof file === "string") return getFileDisplayUrl(file);
    if (file instanceof File) return URL.createObjectURL(file);
    return "";
  };

  const len = images.length;
  const idx = len === 0 ? 0 : Math.min(currentImageIndex, len - 1);
  const current = len > 0 ? images[idx] : null;
  const url = current != null ? getFileUrl(current) : "";

  useEffect(() => {
    setImgError(false);
  }, [idx, url]);

  if (len === 0) {
    return <p className="text-gray-500 text-sm">No images to display</p>;
  }

  return (
    <div className="relative">
      <div className="relative bg-gray-100 rounded-xl overflow-hidden min-h-[200px] flex items-center justify-center">
        {!imgError ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={url}
            alt={`Image ${idx + 1} of ${images.length}`}
            className="w-full h-auto max-h-[300px] sm:max-h-[400px] lg:max-h-[600px] object-contain"
            referrerPolicy="no-referrer"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="p-6 text-center text-gray-600 text-sm">
            <p>Image could not be loaded (blocked URL or network).</p>
            {typeof current === "string" && (
              <a
                href={getFileDisplayUrl(current)}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-block text-indigo-600 underline"
              >
                Open in new tab
              </a>
            )}
          </div>
        )}
      </div>
      {images.length > 1 && (
        <>
          <button
            type="button"
            onClick={() => {
              setImgError(false);
              setCurrentImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
            }}
            className="absolute left-2 sm:left-4 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-1.5 sm:p-2 rounded-full transition-colors z-10"
            aria-label="Previous image"
          >
            <svg className="w-4 h-4 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => {
              setImgError(false);
              setCurrentImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
            }}
            className="absolute right-2 sm:right-4 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-1.5 sm:p-2 rounded-full transition-colors z-10"
            aria-label="Next image"
          >
            <svg className="w-4 h-4 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
          <div className="absolute bottom-2 sm:bottom-4 left-1/2 transform -translate-x-1/2 bg-black/50 text-white px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs sm:text-sm z-10">
            {idx + 1} / {images.length}
          </div>
        </>
      )}
      {images.length > 1 && (
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {images.map((f, i) => (
            <button
              type="button"
              key={i}
              onClick={() => {
                setImgError(false);
                setCurrentImageIndex(i);
              }}
              className={`shrink-0 w-16 h-16 rounded-lg border-2 overflow-hidden ${
                i === idx ? "border-indigo-500 ring-2 ring-indigo-300" : "border-gray-200"
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={getFileUrl(f)}
                alt=""
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function HistoryStrip({
  contentHistory,
  viewingHistory,
  setViewingHistory,
  onViewHistory,
  getThumbnail,
}: {
  contentHistory: ContentVersion[];
  viewingHistory: ContentVersion | null;
  setViewingHistory: (v: ContentVersion | null) => void;
  onViewHistory?: (v: ContentVersion) => void;
  getThumbnail: (f: FileOrUrl) => string;
}) {
  return (
    <div className="mt-6">
      <h4 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
        <span>📜</span> Content History
      </h4>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {contentHistory.map((version, idx) => (
          <button
            key={version.id}
            type="button"
            onClick={() => {
              setViewingHistory(version);
              onViewHistory?.(version);
            }}
            className={`relative group p-2 rounded-lg border-2 transition-all ${
              viewingHistory?.id === version.id ? "border-indigo-500 bg-indigo-50" : "border-gray-200 hover:border-indigo-300"
            }`}
          >
            {version.files[0] ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={getThumbnail(version.files[0])}
                alt={`Version ${idx + 1}`}
                className="w-full h-24 object-cover rounded"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-full h-24 bg-gray-200 rounded flex items-center justify-center text-gray-400 text-xs">No preview</div>
            )}
            <p className="text-xs text-gray-600 mt-1 text-center">
              {new Date(version.uploadedAt).toLocaleDateString()}
            </p>
            <p className="text-xs text-gray-500 text-center">by {version.uploadedBy}</p>
          </button>
        ))}
      </div>
    </div>
  );
}

export default function ContentViewer({
  files,
  postType,
  contentHistory,
  onViewHistory,
}: ContentViewerProps) {
  const [viewingHistory, setViewingHistory] = useState<ContentVersion | null>(null);

  const displayFiles = useMemo(
    () => filterValidFiles(viewingHistory ? viewingHistory.files : files),
    [viewingHistory, files]
  );

  const getFileUrl = (file: FileOrUrl): string => {
    if (typeof file === "string") return getFileDisplayUrl(file);
    if (file instanceof File) return URL.createObjectURL(file);
    return "";
  };

  const getThumbnail = (file: FileOrUrl): string => {
    if (typeof file === "string") return getFileDisplayUrl(file);
    if (file instanceof File && file.type.startsWith("image/")) {
      return URL.createObjectURL(file);
    }
    return "";
  };

  const imageFiles = useMemo(() => displayFiles.filter(isImageFileOrUrl), [displayFiles]);
  const videoFile = useMemo(() => displayFiles.find(isVideoFileOrUrl), [displayFiles]);

  if (displayFiles.length === 0) {
    return <div className="text-gray-500">No content available</div>;
  }

  const historyBlock =
    contentHistory && contentHistory.length > 0 ? (
      <HistoryStrip
        contentHistory={contentHistory}
        viewingHistory={viewingHistory}
        setViewingHistory={setViewingHistory}
        onViewHistory={onViewHistory}
        getThumbnail={getThumbnail}
      />
    ) : null;

  /* Video post: show primary video */
  if (postType === "Video post" && videoFile) {
    return (
      <div className="space-y-4">
        <div className="relative bg-black rounded-xl overflow-hidden">
          <video src={getFileUrl(videoFile)} controls className="w-full h-auto max-h-[300px] sm:max-h-[400px] lg:max-h-[600px]" />
        </div>
        {historyBlock}
      </div>
    );
  }

  /* Multiple images: carousel with thumbnails */
  if (imageFiles.length > 1) {
    return (
      <div className="space-y-4">
        <MultiImageCarousel images={imageFiles} />
        {historyBlock}
      </div>
    );
  }

  /* Single image */
  if (imageFiles.length === 1) {
    const imageUrl = getFileUrl(imageFiles[0]);
    return (
      <div className="space-y-4">
        <div className="relative bg-gray-100 rounded-xl overflow-hidden min-h-[120px] flex items-center justify-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageUrl}
            alt="Content"
            className="w-full h-auto max-h-[300px] sm:max-h-[400px] lg:max-h-[600px] object-contain"
            referrerPolicy="no-referrer"
          />
        </div>
        {typeof imageFiles[0] === "string" && (
          <a
            href={getFileDisplayUrl(imageFiles[0])}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-indigo-600 hover:underline inline-block"
          >
            Open full image
          </a>
        )}
        {historyBlock}
      </div>
    );
  }

  /* Only video(s), non–Video-post type */
  if (videoFile) {
    return (
      <div className="space-y-4">
        <video src={getFileUrl(videoFile)} controls className="w-full rounded-xl max-h-[600px] bg-black" />
        {historyBlock}
      </div>
    );
  }

  return <div className="text-gray-500">No content available</div>;
}
