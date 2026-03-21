"use client";

import { useState, useEffect } from "react";
import Modal from "./Modal";
import ContentViewer from "./ContentViewer";
import type { Deliverable } from "@/types";
import { api } from "@/lib/api";

interface DeliverableDetailModalProps {
  deliverableId: string | null;
  onClose: () => void;
  onEdit?: (deliverable: Deliverable) => void;
}

function formatDateTime(date: string, time: string) {
  return `${new Date(date).toLocaleDateString()} ${time}`;
}

export default function DeliverableDetailModal({
  deliverableId,
  onClose,
  onEdit,
}: DeliverableDetailModalProps) {
  const [deliverable, setDeliverable] = useState<Deliverable | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!deliverableId) {
      setDeliverable(null);
      setError(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    api
      .get<Deliverable>(`/api/deliverables/${deliverableId}`)
      .then((data) => {
        if (!cancelled) setDeliverable(data);
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [deliverableId]);

  if (!deliverableId) return null;

  return (
    <Modal isOpen={!!deliverableId} onClose={onClose} title={deliverable?.name ?? "Deliverable"}>
      {loading && <p className="text-gray-500">Loading...</p>}
      {error && <p className="text-red-600">{error}</p>}
      {deliverable && !loading && (
        <div className="space-y-4">
          <div>
            <span className="text-xs font-semibold text-gray-500">Campaign</span>
            <p className="text-gray-800 font-medium">{deliverable.campaignName}</p>
          </div>
          <div>
            <span className="text-xs font-semibold text-gray-500">Status</span>
            <p className="text-gray-800 font-medium">{deliverable.status}</p>
          </div>
          <div>
            <span className="text-xs font-semibold text-gray-500">Posting date & time</span>
            <p className="text-gray-800">{formatDateTime(deliverable.postingDate, deliverable.postingTime)}</p>
          </div>
          <div>
            <span className="text-xs font-semibold text-gray-500">Caption</span>
            <p className="text-gray-700 whitespace-pre-wrap">{deliverable.caption}</p>
          </div>
          {deliverable.files && deliverable.files.length > 0 && (
            <div>
              <span className="text-xs font-semibold text-gray-500">Content</span>
              <div className="mt-2 rounded-lg overflow-hidden border border-gray-200">
                <ContentViewer
                  files={deliverable.files}
                  postType={deliverable.postType}
                  contentHistory={deliverable.contentHistory}
                />
              </div>
            </div>
          )}
          {deliverable.liveLink && (
            <div>
              <span className="text-xs font-semibold text-gray-500">Live link</span>
              <a
                href={deliverable.liveLink}
                target="_blank"
                rel="noopener noreferrer"
                className="text-indigo-600 hover:underline block mt-1"
              >
                {deliverable.liveLink}
              </a>
            </div>
          )}
          {deliverable.comments && deliverable.comments.length > 0 && (
            <div>
              <span className="text-xs font-semibold text-gray-500">Comments</span>
              <ul className="mt-2 space-y-2">
                {deliverable.comments.map((c) => (
                  <li key={c.id} className="bg-gray-50 p-2 rounded text-sm">
                    <p className="text-gray-800">{c.text}</p>
                    <p className="text-xs text-gray-500">{c.author} · {new Date(c.createdAt).toLocaleString()}</p>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {onEdit && (
            <div className="pt-4 border-t">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onEdit(deliverable);
                }}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium"
              >
                Edit deliverable
              </button>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}
