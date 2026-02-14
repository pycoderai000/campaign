"use client";

import { useState } from "react";
import PostMetrics from "./PostMetrics";
import type { Deliverable, DeliverableStatus } from "@/types";

interface DeliverablesTableProps {
  deliverables: Deliverable[];
  onStatusChange?: (id: string, status: DeliverableStatus) => void;
  onCommentAdd?: (id: string, comment: string) => void;
  showEdit?: boolean;
  onEdit?: (deliverable: Deliverable) => void;
}

export default function DeliverablesTable({
  deliverables,
  onStatusChange,
  onCommentAdd,
  showEdit = false,
  onEdit,
}: DeliverablesTableProps) {
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [showMetrics, setShowMetrics] = useState<string | null>(null);
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

  const formatDateTime = (date: string, time: string) => {
    return `${new Date(date).toLocaleDateString()} ${time}`;
  };

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-soft overflow-hidden border border-gray-200">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gradient-to-r from-indigo-50 to-purple-50">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                Deliverable Name
              </th>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                Campaign
              </th>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                Brand
              </th>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                Post Type
              </th>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                Posting Date
              </th>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {deliverables.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center">
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
              deliverables.map((deliverable) => (
                <>
                  <tr key={deliverable.id} className="hover:bg-indigo-50/50 transition-colors duration-150">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-lg flex items-center justify-center">
                          <span className="text-lg">📦</span>
                        </div>
                        <span className="text-sm font-semibold text-gray-900">{deliverable.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-700 font-medium">{deliverable.campaignName}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-700 font-medium">{deliverable.brandName}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-xs font-semibold">
                        {deliverable.postType}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-600">{formatDateTime(deliverable.postingDate, deliverable.postingTime)}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-3 py-1.5 inline-flex text-xs font-bold rounded-xl ${getStatusColor(
                          deliverable.status
                        )}`}
                      >
                        {deliverable.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setExpandedRow(expandedRow === deliverable.id ? null : deliverable.id);
                            setShowMetrics(null);
                          }}
                          className="px-3 py-1.5 bg-indigo-100 text-indigo-700 rounded-lg text-xs font-semibold hover:bg-indigo-200 transition-colors"
                        >
                          {expandedRow === deliverable.id ? "Hide" : "View"}
                        </button>
                        {showEdit && onEdit && (
                          <button
                            onClick={() => onEdit(deliverable)}
                            className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-xs font-semibold hover:bg-gray-200 transition-colors"
                          >
                            Edit
                          </button>
                        )}
                        <button
                          onClick={() => {
                            setShowMetrics(showMetrics === deliverable.id ? null : deliverable.id);
                            setExpandedRow(null);
                          }}
                          className="px-3 py-1.5 bg-green-100 text-green-700 rounded-lg text-xs font-semibold hover:bg-green-200 transition-colors"
                        >
                          {showMetrics === deliverable.id ? "Hide Stats" : "Stats"}
                        </button>
                      </div>
                    </td>
                  </tr>
                  {expandedRow === deliverable.id && (
                    <tr>
                      <td colSpan={7} className="px-6 py-6 bg-gradient-to-br from-indigo-50/50 to-purple-50/50">
                        <div className="space-y-6">
                          <div className="bg-white/60 backdrop-blur-sm p-4 rounded-xl border border-indigo-100">
                            <h4 className="font-bold text-gray-800 mb-2 flex items-center gap-2">
                              <span>📝</span> Caption
                            </h4>
                            <p className="text-gray-700 leading-relaxed">{deliverable.caption}</p>
                          </div>
                          {deliverable.files.length > 0 && (
                            <div className="bg-white/60 backdrop-blur-sm p-4 rounded-xl border border-indigo-100">
                              <h4 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                                <span>📎</span> Files
                              </h4>
                              <div className="flex gap-2 flex-wrap">
                                {deliverable.files.map((file, idx) => (
                                  <span
                                    key={idx}
                                    className="px-4 py-2 bg-indigo-100 text-indigo-700 rounded-lg text-sm font-semibold border border-indigo-200"
                                  >
                                    {file.name}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                          {deliverable.liveLink && (
                            <div className="bg-white/60 backdrop-blur-sm p-4 rounded-xl border border-indigo-100">
                              <h4 className="font-bold text-gray-800 mb-2 flex items-center gap-2">
                                <span>🔗</span> Live Link
                              </h4>
                              <a
                                href={deliverable.liveLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-indigo-600 hover:text-indigo-700 font-semibold hover:underline flex items-center gap-2"
                              >
                                {deliverable.liveLink}
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                </svg>
                              </a>
                            </div>
                          )}
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
                          {showEdit && (
                            <div>
                              <button
                                onClick={() => {
                                  if (onStatusChange) {
                                    onStatusChange(deliverable.id, "Approved");
                                  }
                                }}
                                className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 font-semibold"
                              >
                                ✓ Approve Content
                              </button>
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
                                  className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all bg-white"
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
                  {showMetrics === deliverable.id && (
                    <tr>
                      <td colSpan={7} className="px-6 py-4 bg-gray-50">
                        <PostMetrics deliverable={deliverable} />
                      </td>
                    </tr>
                  )}
                </>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

