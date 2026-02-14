"use client";

import { useState } from "react";
import Sidebar from "@/components/Sidebar";
import DeliverablesTable from "@/components/DeliverablesTable";
import CampaignMetrics from "@/components/CampaignMetrics";
import Modal from "@/components/Modal";
import EditDeliverableForm from "@/components/EditDeliverableForm";
import type { Campaign, Deliverable, DeliverableStatus } from "@/types";

export default function BrandDashboard() {
  const [activeView, setActiveView] = useState<"campaigns" | "metrics">("campaigns");
  const [selectedCampaign, setSelectedCampaign] = useState<string | null>(null);
  const [showEditDeliverable, setShowEditDeliverable] = useState(false);
  const [editingDeliverable, setEditingDeliverable] = useState<Deliverable | null>(null);

  // Mock data - replace with actual API calls filtered by brand
  const [campaigns] = useState<Campaign[]>([
    {
      id: "1",
      name: "Campaign 1",
      type: "Instagram",
      brandId: "brand1",
      brandName: "Brand 1",
      createdAt: new Date().toISOString(),
    },
    {
      id: "2",
      name: "Campaign 2",
      type: "LinkedIn",
      brandId: "brand1",
      brandName: "Brand 1",
      createdAt: new Date().toISOString(),
    },
  ]);

  const [deliverables, setDeliverables] = useState<Deliverable[]>([
    {
      id: "1",
      name: "Deliverable 1",
      postType: "Static",
      files: [],
      caption: "Sample caption for deliverable 1",
      postingDate: "2024-01-15",
      postingTime: "10:00",
      campaignId: "1",
      campaignName: "Campaign 1",
      brandId: "brand1",
      brandName: "Brand 1",
      status: "New content",
      comments: [],
      createdAt: new Date().toISOString(),
    },
  ]);

  const handleStatusChange = (id: string, status: DeliverableStatus) => {
    setDeliverables(
      deliverables.map((d) => (d.id === id ? { ...d, status } : d))
    );
  };

  const handleCommentAdd = (id: string, comment: string) => {
    setDeliverables(
      deliverables.map((d) => {
        if (d.id === id) {
          return {
            ...d,
            comments: [
              ...d.comments,
              {
                id: Date.now().toString(),
                text: comment,
                author: "Brand User",
                createdAt: new Date().toISOString(),
              },
            ],
          };
        }
        return d;
      })
    );
  };

  const handleApprove = (id: string) => {
    handleStatusChange(id, "Approved");
  };

  const handleEdit = (deliverable: Deliverable) => {
    setEditingDeliverable(deliverable);
    setShowEditDeliverable(true);
  };

  const handleUpdateDeliverable = (updated: Deliverable) => {
    setDeliverables(
      deliverables.map((d) => (d.id === updated.id ? updated : d))
    );
    setShowEditDeliverable(false);
    setEditingDeliverable(null);
  };

  const filteredDeliverables = selectedCampaign
    ? deliverables.filter((d) => d.campaignId === selectedCampaign)
    : deliverables;

  const sidebarItems = [
    { label: "Campaigns", href: "#", onClick: () => setActiveView("campaigns"), viewKey: "campaigns" },
    { label: "Metrics", href: "#", onClick: () => setActiveView("metrics"), viewKey: "metrics" },
  ];

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <Sidebar role="brand" items={sidebarItems} activeView={activeView} />
      <div className="flex-1 p-8 overflow-auto">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent mb-2">
                Brand Dashboard
              </h1>
              <p className="text-gray-600 font-medium">Manage your campaigns and deliverables</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-2xl">🏢</span>
              </div>
            </div>
          </div>
        </div>

        {activeView === "campaigns" && (
          <div>
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-slate-800 mb-6">Campaigns</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                <button
                  onClick={() => setSelectedCampaign(null)}
                  className={`group p-6 rounded-2xl border-2 transition-all duration-200 text-left transform hover:scale-105 ${
                    selectedCampaign === null
                      ? "border-indigo-500 bg-gradient-to-br from-indigo-50 to-purple-50 shadow-lg"
                      : "border-gray-200 bg-white/80 backdrop-blur-sm hover:border-indigo-300 hover:shadow-md"
                  }`}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                      selectedCampaign === null
                        ? "bg-gradient-to-br from-indigo-500 to-purple-600"
                        : "bg-gray-100"
                    }`}>
                      <span className="text-2xl">📊</span>
                    </div>
                    <h3 className={`font-bold text-lg ${
                      selectedCampaign === null ? "text-indigo-700" : "text-gray-800"
                    }`}>All Campaigns</h3>
                  </div>
                  <p className={`text-sm font-semibold ${
                    selectedCampaign === null ? "text-indigo-600" : "text-gray-600"
                  }`}>
                    {deliverables.length} deliverables
                  </p>
                </button>
                {campaigns.map((campaign) => {
                  const campaignDeliverables = deliverables.filter(
                    (d) => d.campaignId === campaign.id
                  );
                  const isSelected = selectedCampaign === campaign.id;
                  const typeColors: Record<string, string> = {
                    LinkedIn: "from-blue-500 to-blue-600",
                    Instagram: "from-pink-500 to-purple-600",
                    YouTube: "from-red-500 to-red-600",
                    TikTok: "from-gray-800 to-gray-900",
                  };
                  return (
                    <button
                      key={campaign.id}
                      onClick={() => setSelectedCampaign(campaign.id)}
                      className={`group p-6 rounded-2xl border-2 transition-all duration-200 text-left transform hover:scale-105 ${
                        isSelected
                          ? "border-indigo-500 bg-gradient-to-br from-indigo-50 to-purple-50 shadow-lg"
                          : "border-gray-200 bg-white/80 backdrop-blur-sm hover:border-indigo-300 hover:shadow-md"
                      }`}
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                          isSelected
                            ? `bg-gradient-to-br ${typeColors[campaign.type] || "from-indigo-500 to-purple-600"}`
                            : "bg-gray-100"
                        }`}>
                          <span className="text-2xl">
                            {campaign.type === "LinkedIn" ? "💼" : campaign.type === "Instagram" ? "📷" : campaign.type === "YouTube" ? "📺" : "🎵"}
                          </span>
                        </div>
                        <h3 className={`font-bold text-lg ${
                          isSelected ? "text-indigo-700" : "text-gray-800"
                        }`}>{campaign.name}</h3>
                      </div>
                      <p className={`text-sm font-semibold ${
                        isSelected ? "text-indigo-600" : "text-gray-600"
                      }`}>
                        {campaign.type} • {campaignDeliverables.length} deliverables
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <h3 className="text-2xl font-bold text-slate-800 mb-6">
                {selectedCampaign
                  ? `Deliverables for ${campaigns.find((c) => c.id === selectedCampaign)?.name}`
                  : "All Deliverables"}
              </h3>
              {filteredDeliverables.length === 0 ? (
                <div className="bg-white/80 backdrop-blur-sm p-16 rounded-2xl shadow-soft text-center border border-gray-200">
                  <div className="w-20 h-20 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <svg className="w-10 h-10 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                    </svg>
                  </div>
                  <p className="text-gray-600 text-lg font-semibold mb-2">No deliverables found</p>
                  <p className="text-gray-400 text-sm">
                    {selectedCampaign
                      ? "This campaign doesn't have any deliverables yet"
                      : "No deliverables available"}
                  </p>
                </div>
              ) : (
                <DeliverablesTable
                  deliverables={filteredDeliverables}
                  onStatusChange={handleStatusChange}
                  onCommentAdd={handleCommentAdd}
                  showEdit={true}
                  onEdit={handleEdit}
                />
              )}
            </div>
          </div>
        )}

        {activeView === "metrics" && (
          <div>
            <h2 className="text-3xl font-bold text-slate-800 mb-6">Campaign Metrics</h2>
            <CampaignMetrics campaigns={campaigns} deliverables={deliverables} />
          </div>
        )}

        <Modal
          isOpen={showEditDeliverable}
          onClose={() => {
            setShowEditDeliverable(false);
            setEditingDeliverable(null);
          }}
          title="Edit Deliverable"
        >
          {editingDeliverable && (
            <EditDeliverableForm
              deliverable={editingDeliverable}
              onSubmit={handleUpdateDeliverable}
              onCancel={() => {
                setShowEditDeliverable(false);
                setEditingDeliverable(null);
              }}
            />
          )}
        </Modal>
      </div>
    </div>
  );
}

