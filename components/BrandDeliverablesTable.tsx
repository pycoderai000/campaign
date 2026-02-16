"use client";

import { useState } from "react";
import Modal from "./Modal";
import ContentViewer from "./ContentViewer";
import type { Deliverable, DeliverableStatus, FileOrUrl } from "@/types";

interface BrandDeliverablesTableProps {
  deliverables: Deliverable[];
  onStatusChange?: (id: string, status: DeliverableStatus) => void;
  onCommentAdd?: (id: string, comment: string) => void;
  onEdit?: (deliverable: Deliverable) => void;
}

export default function BrandDeliverablesTable({
  deliverables,
  onStatusChange,
  onCommentAdd,
  onEdit,
}: BrandDeliverablesTableProps) {
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [showContentViewer, setShowContentViewer] = useState(false);
  const [viewingDeliverable, setViewingDeliverable] = useState<Deliverable | null>(null);
  const [commentText, setCommentText] = useState<Record<string, string>>({});

  const getStatusColor = (status: DeliverableStatus) => {
    const colors: Record<DeliverableStatus, string> = {
      "New content": "bg-blue-100 text-blue-700 border border-blue-200",
      "In revision": "bg-yellow-100 text-yellow-700 border border-yellow-200",
      Approved: "bg-green-100 text-green-700 border border-green-200",
      Live: "bg-purple-100 text-purple-700 border border-purple-200",
      Cancelled: "bg-red-100 text-red-700 border border-red-200",
    };
    return colors[status] || "bg-gray-100 text-gray-700 border border-gray-200";
  };

  const getThumbnail = (deliverable: Deliverable): string | null => {
    if (deliverable.files.length === 0) return null;
    const firstFile: FileOrUrl = deliverable.files[0];
    if (typeof firstFile === "string") {
      return firstFile; // Already a URL
    }
    if (firstFile instanceof File && firstFile.type.startsWith("image/")) {
      return URL.createObjectURL(firstFile);
    }
    return null; // Video thumbnail would need to be generated
  };

  const formatDateTime = (date: string, time: string) => {
    return `${new Date(date).toLocaleDateString()} ${time}`;
  };

  const handleViewContent = (deliverable: Deliverable) => {
    setViewingDeliverable(deliverable);
    setShowContentViewer(true);
  };

  return (
    <>
      <div className="bg-white/80 backdrop-blur-sm rounded-xl sm:rounded-2xl shadow-soft overflow-hidden border border-gray-200">
        <div className="overflow-x-auto -mx-4 sm:mx-0">
          <div className="inline-block min-w-full align-middle px-4 sm:px-0">
            <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gradient-to-r from-indigo-50 to-purple-50">
              <tr>
                <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Thumbnail
                </th>
                <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider hidden sm:table-cell">
                  Type
                </th>
                <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider hidden lg:table-cell">
                  Date
                </th>
                <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {deliverables.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center">
                      <div className="w-16 h-16 bg-gray-100 rounded-xl flex items-center justify-center mb-4">
                        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                        </svg>
                      </div>
                      <p className="text-gray-500 font-semibold">No deliverables found</p>
                    </div>
                  </td>
                </tr>
              ) : (
                deliverables.map((deliverable) => {
                  const thumbnail = getThumbnail(deliverable);
                  return (
                    <>
                      <tr key={deliverable.id} id={`deliverable-${deliverable.id}`} className="hover:bg-indigo-50/50 transition-colors duration-150">
                        <td className="px-3 sm:px-6 py-3 sm:py-4">
                          <div className="w-12 h-12 sm:w-16 sm:h-20 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center">
                            {thumbnail ? (
                              <img
                                src={thumbnail}
                                alt="Thumbnail"
                                className="w-full h-full object-cover cursor-pointer"
                                onClick={() => handleViewContent(deliverable)}
                              />
                            ) : deliverable.postType === "Video post" ? (
                              <div className="relative w-full h-full flex items-center justify-center bg-gray-200">
                                <svg className="w-8 h-8 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                                  <path d="M8 5v14l11-7z" />
                                </svg>
                                <div className="absolute bottom-1 right-1 bg-black/70 text-white text-xs px-1 rounded">
                                  Video
                                </div>
                              </div>
                            ) : (
                              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                            )}
                          </div>
                        </td>
                        <td className="px-3 sm:px-6 py-3 sm:py-4">
                          <div className="min-w-0">
                            <span className="text-xs sm:text-sm font-semibold text-gray-900 block truncate">{deliverable.name}</span>
                            <span className="text-xs text-gray-500 sm:hidden">{deliverable.postType}</span>
                          </div>
                        </td>
                        <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap hidden sm:table-cell">
                          <span className="px-2 sm:px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-xs font-semibold">
                            {deliverable.postType}
                          </span>
                        </td>
                        <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap hidden lg:table-cell">
                          <span className="text-xs sm:text-sm text-gray-600">{formatDateTime(deliverable.postingDate, deliverable.postingTime)}</span>
                        </td>
                        <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                          <span
                            className={`px-2 sm:px-3 py-1 sm:py-1.5 inline-flex text-xs font-bold rounded-xl ${getStatusColor(
                              deliverable.status
                            )}`}
                          >
                            {deliverable.status}
                          </span>
                        </td>
                        <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                          <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
                            <button
                              onClick={() => handleViewContent(deliverable)}
                              className="px-3 py-1.5 bg-indigo-100 text-indigo-700 rounded-lg text-xs font-semibold hover:bg-indigo-200 transition-colors"
                            >
                              View
                            </button>
                            <button
                              onClick={() =>
                                setExpandedRow(expandedRow === deliverable.id ? null : deliverable.id)
                              }
                              className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-xs font-semibold hover:bg-gray-200 transition-colors"
                            >
                              {expandedRow === deliverable.id ? "Hide" : "Details"}
                            </button>
                            {onEdit && (
                              <button
                                onClick={() => onEdit(deliverable)}
                                className="px-3 py-1.5 bg-green-100 text-green-700 rounded-lg text-xs font-semibold hover:bg-green-200 transition-colors"
                              >
                                Edit
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                      {expandedRow === deliverable.id && (
                        <tr>
                          <td colSpan={6} className="px-6 py-6 bg-gradient-to-br from-indigo-50/50 to-purple-50/50">
                            <div className="space-y-6">
                              <div className="bg-white/60 backdrop-blur-sm p-4 rounded-xl border border-indigo-100">
                                <h4 className="font-bold text-gray-800 mb-2 flex items-center gap-2">
                                  <span>📝</span> Caption
                                </h4>
                                <p className="text-gray-700 leading-relaxed">{deliverable.caption}</p>
                              </div>

                              {onStatusChange && (
                                <div className="bg-white/60 backdrop-blur-sm p-4 rounded-xl border border-indigo-100">
                                  <h4 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                                    <span>🔄</span> Change Status
                                  </h4>
                                  <select
                                    value={deliverable.status}
                                    onChange={(e) =>
                                      onStatusChange(
                                        deliverable.id,
                                        e.target.value as DeliverableStatus
                                      )
                                    }
                                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all bg-white"
                                  >
                                    <option value="New content">New content</option>
                                    <option value="In revision">In revision</option>
                                    <option value="Approved">Approved</option>
                                    <option value="Live">Live</option>
                                    <option value="Cancelled">Cancelled</option>
                                  </select>
                                </div>
                              )}

                              {deliverable.revisions && deliverable.revisions.length > 0 && (
                                <div className="bg-white/60 backdrop-blur-sm p-4 rounded-xl border border-indigo-100">
                                  <h4 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                                    <span>📋</span> Revision History
                                  </h4>
                                  <div className="space-y-3">
                                    {deliverable.revisions.map((revision) => (
                                      <div
                                        key={revision.id}
                                        className="bg-white p-4 rounded-xl border border-gray-200"
                                      >
                                        <p className="text-sm text-gray-700 mb-2">{revision.revisionNote}</p>
                                        <p className="text-xs text-gray-500">
                                          Requested by {revision.requestedBy} on{" "}
                                          {new Date(revision.requestedAt).toLocaleString()}
                                        </p>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              <div className="bg-white/60 backdrop-blur-sm p-4 rounded-xl border border-indigo-100">
                                <h4 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                                  <span>💬</span> Comments
                                </h4>
                                <div className="space-y-3 mb-4">
                                  {deliverable.comments.length === 0 ? (
                                    <p className="text-gray-400 text-sm">No comments yet</p>
                                  ) : (
                                    deliverable.comments.map((comment) => (
                                      <div
                                        key={comment.id}
                                        className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm"
                                      >
                                        <p className="text-sm text-gray-700 mb-2">{comment.text}</p>
                                        <p className="text-xs text-gray-500">
                                          {comment.author} • {new Date(comment.createdAt).toLocaleString()}
                                        </p>
                                      </div>
                                    ))
                                  )}
                                </div>
                                {onCommentAdd && (
                                  <div className="flex gap-2">
                                    <input
                                      type="text"
                                      value={commentText[deliverable.id] || ""}
                                      onChange={(e) =>
                                        setCommentText({
                                          ...commentText,
                                          [deliverable.id]: e.target.value,
                                        })
                                      }
                                      placeholder="Add a comment..."
                                      className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all bg-white"
                                      onKeyPress={(e) => {
                                        if (e.key === "Enter" && commentText[deliverable.id]) {
                                          onCommentAdd(deliverable.id, commentText[deliverable.id]);
                                          setCommentText({ ...commentText, [deliverable.id]: "" });
                                        }
                                      }}
                                    />
                                    <button
                                      onClick={() => {
                                        if (commentText[deliverable.id]) {
                                          onCommentAdd(deliverable.id, commentText[deliverable.id]);
                                          setCommentText({ ...commentText, [deliverable.id]: "" });
                                        }
                                      }}
                                      className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 shadow-lg font-semibold"
                                    >
                                      Add
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  );
                })
              )}
            </tbody>
          </table>
          </div>
        </div>
      </div>

      <Modal
        isOpen={showContentViewer}
        onClose={() => {
          setShowContentViewer(false);
          setViewingDeliverable(null);
        }}
        title={viewingDeliverable?.name || "Content Viewer"}
      >
        {viewingDeliverable && (
          <ContentViewer
            files={viewingDeliverable.files}
            postType={viewingDeliverable.postType}
            contentHistory={viewingDeliverable.contentHistory}
          />
        )}
      </Modal>
    </>
  );
}

