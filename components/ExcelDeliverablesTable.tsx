"use client";

import { useState } from "react";
import Modal from "./Modal";
import ContentViewer from "./ContentViewer";
import type { Deliverable, DeliverableStatus, PostType, FileOrUrl, Campaign } from "@/types";

interface ExcelDeliverablesTableProps {
  campaigns: Campaign[];
  onSave: (deliverables: Deliverable[]) => void;
  onCancel: () => void;
}

const postTypes: PostType[] = ["Static", "Carousel", "Video post"];
const statuses: DeliverableStatus[] = [
  "New content",
  "In revision",
  "Approved",
  "Live",
  "Cancelled",
];

export default function ExcelDeliverablesTable({
  campaigns,
  onSave,
  onCancel,
}: ExcelDeliverablesTableProps) {
  const [rows, setRows] = useState<Partial<Deliverable>[]>([
    {
      name: "",
      postType: "Static",
      caption: "",
      postingDate: "",
      postingTime: "",
      status: "New content",
      campaignId: campaigns[0]?.id || "",
      campaignName: campaigns[0]?.name || "",
      brandId: campaigns[0]?.brandId || "",
      brandName: campaigns[0]?.brandName || "",
      files: [],
    },
  ]);
  const [showContentViewer, setShowContentViewer] = useState(false);
  const [viewingDeliverable, setViewingDeliverable] = useState<Partial<Deliverable> | null>(null);
  const [editingRowIndex, setEditingRowIndex] = useState<number | null>(null);

  const addRow = () => {
    setRows([
      ...rows,
      {
        name: "",
        postType: "Static",
        caption: "",
        postingDate: "",
        postingTime: "",
        status: "New content",
        campaignId: campaigns[0]?.id || "",
        campaignName: campaigns[0]?.name || "",
        brandId: campaigns[0]?.brandId || "",
        brandName: campaigns[0]?.brandName || "",
        files: [],
      },
    ]);
  };

  const deleteRow = (index: number) => {
    setRows(rows.filter((_, i) => i !== index));
  };

  const updateRow = (index: number, field: keyof Deliverable, value: any) => {
    const updated = [...rows];
    updated[index] = { ...updated[index], [field]: value };
    
    // Auto-fill brand info when campaign changes
    if (field === "campaignId") {
      const campaign = campaigns.find((c) => c.id === value);
      if (campaign) {
        updated[index].campaignName = campaign.name;
        updated[index].brandId = campaign.brandId;
        updated[index].brandName = campaign.brandName;
      }
    }
    
    setRows(updated);
  };

  const handleFileUpload = (index: number, files: FileList | null) => {
    if (files) {
      const updated = [...rows];
      updated[index] = {
        ...updated[index],
        files: Array.from(files),
      };
      setRows(updated);
    }
  };

  const handleSave = () => {
    const validDeliverables = rows
      .filter((row) => row.name && row.caption && row.postingDate && row.postingTime && row.campaignId)
      .map((row, index) => ({
        id: `temp-${index}`,
        name: row.name!,
        postType: row.postType!,
        files: row.files || [],
        caption: row.caption!,
        postingDate: row.postingDate!,
        postingTime: row.postingTime!,
        campaignId: row.campaignId!,
        campaignName: row.campaignName!,
        brandId: row.brandId!,
        brandName: row.brandName!,
        status: row.status!,
        comments: [],
        createdAt: new Date().toISOString(),
        contentHistory: [],
        revisions: [],
      }));
    
    onSave(validDeliverables);
  };

  const handleViewContent = (row: Partial<Deliverable>, index: number) => {
    setViewingDeliverable(row);
    setShowContentViewer(true);
  };

  return (
    <>
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-xl font-bold text-gray-800">Create Deliverables (Excel Style)</h3>
          <button
            onClick={addRow}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-semibold"
          >
            + Add Row
          </button>
        </div>

        <div className="bg-white/80 backdrop-blur-sm rounded-xl sm:rounded-2xl shadow-soft overflow-hidden border border-gray-200">
          <div className="overflow-x-auto -mx-4 sm:mx-0">
            <div className="inline-block min-w-full align-middle px-4 sm:px-0">
              <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gradient-to-r from-indigo-50 to-purple-50">
                <tr>
                  <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs font-bold text-gray-700 uppercase">Name</th>
                  <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs font-bold text-gray-700 uppercase hidden md:table-cell">Campaign</th>
                  <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs font-bold text-gray-700 uppercase hidden lg:table-cell">Type</th>
                  <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs font-bold text-gray-700 uppercase hidden xl:table-cell">Caption</th>
                  <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs font-bold text-gray-700 uppercase hidden lg:table-cell">Date</th>
                  <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs font-bold text-gray-700 uppercase hidden xl:table-cell">Time</th>
                  <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs font-bold text-gray-700 uppercase">Status</th>
                  <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs font-bold text-gray-700 uppercase">Upload</th>
                  <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs font-bold text-gray-700 uppercase">View</th>
                  <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs font-bold text-gray-700 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {rows.map((row, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-2 sm:px-4 py-2 sm:py-3">
                      <input
                        type="text"
                        value={row.name || ""}
                        onChange={(e) => updateRow(index, "name", e.target.value)}
                        className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 outline-none text-xs sm:text-sm"
                        placeholder="Name"
                      />
                    </td>
                    <td className="px-2 sm:px-4 py-2 sm:py-3 hidden md:table-cell">
                      <select
                        value={row.campaignId || ""}
                        onChange={(e) => updateRow(index, "campaignId", e.target.value)}
                        className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 outline-none text-xs sm:text-sm"
                      >
                        {campaigns.map((campaign) => (
                          <option key={campaign.id} value={campaign.id}>
                            {campaign.name}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-2 sm:px-4 py-2 sm:py-3 hidden lg:table-cell">
                      <select
                        value={row.postType || "Static"}
                        onChange={(e) => updateRow(index, "postType", e.target.value)}
                        className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 outline-none text-xs sm:text-sm"
                      >
                        {postTypes.map((type) => (
                          <option key={type} value={type}>
                            {type}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-2 sm:px-4 py-2 sm:py-3 hidden xl:table-cell">
                      <textarea
                        value={row.caption || ""}
                        onChange={(e) => updateRow(index, "caption", e.target.value)}
                        className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 outline-none text-xs sm:text-sm resize-none"
                        rows={2}
                        placeholder="Caption..."
                      />
                    </td>
                    <td className="px-2 sm:px-4 py-2 sm:py-3 hidden lg:table-cell">
                      <input
                        type="date"
                        value={row.postingDate || ""}
                        onChange={(e) => updateRow(index, "postingDate", e.target.value)}
                        className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 outline-none text-xs sm:text-sm"
                      />
                    </td>
                    <td className="px-2 sm:px-4 py-2 sm:py-3 hidden xl:table-cell">
                      <input
                        type="time"
                        value={row.postingTime || ""}
                        onChange={(e) => updateRow(index, "postingTime", e.target.value)}
                        className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 outline-none text-xs sm:text-sm"
                      />
                    </td>
                    <td className="px-2 sm:px-4 py-2 sm:py-3">
                      <select
                        value={row.status || "New content"}
                        onChange={(e) => updateRow(index, "status", e.target.value)}
                        className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 outline-none text-xs sm:text-sm"
                      >
                        {statuses.map((status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-2 sm:px-4 py-2 sm:py-3">
                      <label className="cursor-pointer">
                        <input
                          type="file"
                          onChange={(e) => handleFileUpload(index, e.target.files)}
                          multiple={row.postType === "Carousel"}
                          accept="image/*,video/*"
                          className="hidden"
                        />
                        <span className="px-2 sm:px-3 py-1 sm:py-1.5 bg-indigo-100 text-indigo-700 rounded-lg text-xs font-semibold hover:bg-indigo-200 transition-colors inline-block">
                          {row.files && row.files.length > 0 ? `${row.files.length}` : "📤"}
                        </span>
                      </label>
                    </td>
                    <td className="px-2 sm:px-4 py-2 sm:py-3">
                      {row.files && row.files.length > 0 ? (
                        <button
                          onClick={() => handleViewContent(row, index)}
                          className="px-2 sm:px-3 py-1 sm:py-1.5 bg-green-100 text-green-700 rounded-lg text-xs font-semibold hover:bg-green-200 transition-colors"
                        >
                          👁️
                        </button>
                      ) : (
                        <span className="text-gray-400 text-xs">-</span>
                      )}
                    </td>
                    <td className="px-2 sm:px-4 py-2 sm:py-3">
                      <button
                        onClick={() => deleteRow(index)}
                        className="px-2 sm:px-3 py-1 sm:py-1.5 bg-red-100 text-red-700 rounded-lg text-xs font-semibold hover:bg-red-200 transition-colors"
                      >
                        🗑️
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-end">
          <button
            onClick={onCancel}
            className="px-4 sm:px-6 py-2.5 sm:py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-all text-sm sm:text-base"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg text-sm sm:text-base"
          >
            Save All Deliverables
          </button>
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
        {viewingDeliverable && viewingDeliverable.files && viewingDeliverable.files.length > 0 && (
          <ContentViewer
            files={viewingDeliverable.files}
            postType={viewingDeliverable.postType || "Static"}
            contentHistory={viewingDeliverable.contentHistory}
          />
        )}
      </Modal>
    </>
  );
}

