"use client";

import { useState } from "react";
import type { PostType, ContentVersion, FileOrUrl } from "@/types";

interface ContentViewerProps {
  files: FileOrUrl[];
  postType: PostType;
  contentHistory?: ContentVersion[];
  onViewHistory?: (version: ContentVersion) => void;
}

export default function ContentViewer({
  files,
  postType,
  contentHistory,
  onViewHistory,
}: ContentViewerProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [viewingHistory, setViewingHistory] = useState<ContentVersion | null>(null);

  const displayFiles = viewingHistory ? viewingHistory.files : files;

  const handleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const getThumbnail = (file: FileOrUrl): string => {
    if (typeof file === "string") {
      return file; // Already a URL
    }
    if (file instanceof File && file.type.startsWith("image/")) {
      return URL.createObjectURL(file);
    }
    return ""; // Video thumbnail would need to be generated
  };

  const getFileUrl = (file: FileOrUrl): string => {
    if (typeof file === "string") {
      return file;
    }
    if (file instanceof File) {
      return URL.createObjectURL(file);
    }
    return "";
  };

  const getFileType = (file: FileOrUrl): string => {
    if (typeof file === "string") {
      // Try to determine from URL extension
      if (file.match(/\.(jpg|jpeg|png|gif|webp)$/i)) return "image";
      if (file.match(/\.(mp4|webm|ogg)$/i)) return "video";
      return "image"; // Default
    }
    if (file instanceof File) {
      return file.type.startsWith("video/") ? "video" : "image";
    }
    return "image";
  };

  if (postType === "Video post" && displayFiles.length > 0) {
    const videoFile = displayFiles[0];
    const videoUrl = getFileUrl(videoFile);

    return (
      <div className="relative">
        <div className="relative bg-black rounded-xl overflow-hidden">
          <video
            ref={(video) => {
              if (video) {
                video.onplay = () => setIsPlaying(true);
                video.onpause = () => setIsPlaying(false);
              }
            }}
            src={videoUrl}
            controls
            className="w-full h-auto max-h-[300px] sm:max-h-[400px] lg:max-h-[600px]"
            onLoadedMetadata={(e) => {
              const target = e.target as HTMLVideoElement;
              target.controls = true;
            }}
          />
          <button
            onClick={handleFullscreen}
            className="absolute bottom-4 right-4 bg-black/50 hover:bg-black/70 text-white p-2 rounded-lg transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
            </svg>
          </button>
        </div>
        {contentHistory && contentHistory.length > 0 && (
          <div className="mt-6">
            <h4 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
              <span>📜</span> Content History
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {contentHistory.map((version, idx) => (
                <button
                  key={version.id}
                  onClick={() => {
                    setViewingHistory(version);
                    onViewHistory?.(version);
                  }}
                  className={`relative group p-2 rounded-lg border-2 transition-all ${
                    viewingHistory?.id === version.id
                      ? "border-indigo-500 bg-indigo-50"
                      : "border-gray-200 hover:border-indigo-300"
                  }`}
                >
                  {getFileType(version.files[0]) === "video" ? (
                    <div className="relative">
                      <div className="w-full h-24 bg-gray-200 rounded flex items-center justify-center">
                        <svg className="w-8 h-8 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      </div>
                      <div className="absolute bottom-1 right-1 bg-black/70 text-white text-xs px-1 rounded">
                        Video
                      </div>
                    </div>
                  ) : version.files[0] ? (
                    <img
                      src={getThumbnail(version.files[0])}
                      alt={`Version ${idx + 1}`}
                      className="w-full h-24 object-cover rounded"
                    />
                  ) : null}
                  <p className="text-xs text-gray-600 mt-1 text-center">
                    {new Date(version.uploadedAt).toLocaleDateString()}
                  </p>
                  <p className="text-xs text-gray-500 text-center">by {version.uploadedBy}</p>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  if (postType === "Static" && displayFiles.length > 0) {
    const imageFile = displayFiles[0];
    const imageUrl = getFileUrl(imageFile);

    return (
      <div className="relative">
        <div className="relative bg-gray-100 rounded-xl overflow-hidden">
          <img
            src={imageUrl}
            alt="Content"
            className="w-full h-auto max-h-[300px] sm:max-h-[400px] lg:max-h-[600px] object-contain cursor-pointer"
            onClick={handleFullscreen}
          />
          <button
            onClick={handleFullscreen}
            className="absolute bottom-4 right-4 bg-black/50 hover:bg-black/70 text-white p-2 rounded-lg transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
            </svg>
          </button>
        </div>
        {contentHistory && contentHistory.length > 0 && (
          <div className="mt-6">
            <h4 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
              <span>📜</span> Content History
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {contentHistory.map((version, idx) => (
                <button
                  key={version.id}
                  onClick={() => {
                    setViewingHistory(version);
                    onViewHistory?.(version);
                  }}
                  className={`relative group p-2 rounded-lg border-2 transition-all ${
                    viewingHistory?.id === version.id
                      ? "border-indigo-500 bg-indigo-50"
                      : "border-gray-200 hover:border-indigo-300"
                  }`}
                >
                  <img
                    src={getThumbnail(version.files[0])}
                    alt={`Version ${idx + 1}`}
                    className="w-full h-24 object-cover rounded"
                  />
                  <p className="text-xs text-gray-600 mt-1 text-center">
                    {new Date(version.uploadedAt).toLocaleDateString()}
                  </p>
                  <p className="text-xs text-gray-500 text-center">by {version.uploadedBy}</p>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  if (postType === "Carousel" && displayFiles.length > 0) {
    return (
      <div className="relative">
        <div className="relative bg-gray-100 rounded-xl overflow-hidden">
          <img
            src={getFileUrl(displayFiles[currentImageIndex])}
            alt={`Slide ${currentImageIndex + 1}`}
            className="w-full h-auto max-h-[300px] sm:max-h-[400px] lg:max-h-[600px] object-contain"
          />
          {displayFiles.length > 1 && (
            <>
              <button
                onClick={() =>
                  setCurrentImageIndex((prev) => (prev === 0 ? displayFiles.length - 1 : prev - 1))
                }
                className="absolute left-2 sm:left-4 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-1.5 sm:p-2 rounded-full transition-colors"
              >
                <svg className="w-4 h-4 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                onClick={() =>
                  setCurrentImageIndex((prev) => (prev === displayFiles.length - 1 ? 0 : prev + 1))
                }
                className="absolute right-2 sm:right-4 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-1.5 sm:p-2 rounded-full transition-colors"
              >
                <svg className="w-4 h-4 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
              <div className="absolute bottom-2 sm:bottom-4 left-1/2 transform -translate-x-1/2 bg-black/50 text-white px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs sm:text-sm">
                {currentImageIndex + 1} / {displayFiles.length}
              </div>
            </>
          )}
        </div>
        {contentHistory && contentHistory.length > 0 && (
          <div className="mt-6">
            <h4 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
              <span>📜</span> Content History
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {contentHistory.map((version, idx) => (
                <button
                  key={version.id}
                  onClick={() => {
                    setViewingHistory(version);
                    onViewHistory?.(version);
                  }}
                  className={`relative group p-2 rounded-lg border-2 transition-all ${
                    viewingHistory?.id === version.id
                      ? "border-indigo-500 bg-indigo-50"
                      : "border-gray-200 hover:border-indigo-300"
                  }`}
                >
                  <img
                    src={getThumbnail(version.files[0])}
                    alt={`Version ${idx + 1}`}
                    className="w-full h-24 object-cover rounded"
                  />
                  <p className="text-xs text-gray-600 mt-1 text-center">
                    {new Date(version.uploadedAt).toLocaleDateString()}
                  </p>
                  <p className="text-xs text-gray-500 text-center">by {version.uploadedBy}</p>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  return <div className="text-gray-500">No content available</div>;
}

