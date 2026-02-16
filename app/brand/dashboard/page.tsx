"use client";

import { useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import BrandDeliverablesTable from "@/components/BrandDeliverablesTable";
import CampaignMetrics from "@/components/CampaignMetrics";
import SocialMediaMetrics from "@/components/SocialMediaMetrics";
import NotificationBar from "@/components/NotificationBar";
import Modal from "@/components/Modal";
import BrandEditDeliverableForm from "@/components/BrandEditDeliverableForm";
import type {
  Campaign,
  Deliverable,
  DeliverableStatus,
  Notification,
  SocialMediaMetrics as SocialMediaMetricsType,
  ContentVersion,
  Revision,
} from "@/types";

export default function BrandDashboard() {
  const [activeView, setActiveView] = useState<"campaigns" | "metrics" | "social">("campaigns");
  const [selectedCampaign, setSelectedCampaign] = useState<string | null>(null);
  const [showEditDeliverable, setShowEditDeliverable] = useState(false);
  const [editingDeliverable, setEditingDeliverable] = useState<Deliverable | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);

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
      files: [new File([], "image1.jpg", { type: "image/jpeg" })],
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
      contentHistory: [],
      revisions: [],
    },
  ]);

  const [socialMetrics] = useState<SocialMediaMetricsType>({
    followers: [
      { month: "Jan", count: 10000 },
      { month: "Feb", count: 12000 },
      { month: "Mar", count: 15000 },
      { month: "Apr", count: 18000 },
      { month: "May", count: 22000 },
      { month: "Jun", count: 25000 },
    ],
    engagementGrowth: [
      { month: "Jan", growth: 2.5 },
      { month: "Feb", growth: 3.2 },
      { month: "Mar", growth: 3.8 },
      { month: "Apr", growth: 4.1 },
      { month: "May", growth: 4.5 },
      { month: "Jun", growth: 5.2 },
    ],
    totalFollowers: 25000,
    engagementRate: 5.2,
  });

  const handleStatusChange = (id: string, status: DeliverableStatus) => {
    setDeliverables(
      deliverables.map((d) => (d.id === id ? { ...d, status } : d))
    );
  };

  const handleCommentAdd = (id: string, comment: string) => {
    setDeliverables(
      deliverables.map((d) => {
        if (d.id === id) {
          const updated = {
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
          
          // Add notification for new comment
          addNotification({
            type: "new_comment",
            title: "New Comment",
            message: `New comment added to ${d.name}`,
            deliverableId: d.id,
            campaignId: d.campaignId,
          });
          
          return updated;
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

  const handleUpdateDeliverable = (data: Partial<Deliverable> & { revisionNote?: string; newFiles?: File[] }) => {
    const updated = deliverables.map((d) => {
      if (d.id === data.id) {
        const updatedDeliverable: Deliverable = {
          ...d,
          ...data,
        };

        // If new files are uploaded, add to content history and create revision
        if (data.newFiles && data.newFiles.length > 0 && data.revisionNote) {
          const newVersion: ContentVersion = {
            id: Date.now().toString(),
            files: data.newFiles,
            uploadedAt: new Date().toISOString(),
            uploadedBy: "Brand User",
            revisionNote: data.revisionNote,
          };

          const newRevision: Revision = {
            id: Date.now().toString(),
            deliverableId: d.id,
            revisionNote: data.revisionNote,
            requestedBy: "Brand User",
            requestedAt: new Date().toISOString(),
            files: data.newFiles,
          };

          updatedDeliverable.contentHistory = [
            ...(d.contentHistory || []),
            {
              id: Date.now().toString(),
              files: d.files,
              uploadedAt: d.createdAt,
              uploadedBy: "Admin",
            },
          ];
          updatedDeliverable.files = data.newFiles;
          updatedDeliverable.revisions = [...(d.revisions || []), newRevision];

          // Add notification for revision
          addNotification({
            type: "revision",
            title: "Revision Requested",
            message: `Revision requested for ${d.name}`,
            deliverableId: d.id,
            campaignId: d.campaignId,
          });
        }

        // Add notification for status change
        if (data.status && data.status !== d.status) {
          addNotification({
            type: "status_change",
            title: "Status Changed",
            message: `${d.name} status changed to ${data.status}`,
            deliverableId: d.id,
            campaignId: d.campaignId,
          });
        }

        return updatedDeliverable;
      }
      return d;
    });

    setDeliverables(updated);
    setShowEditDeliverable(false);
    setEditingDeliverable(null);
  };

  const addNotification = (notification: Omit<Notification, "id" | "read" | "createdAt">) => {
    const newNotification: Notification = {
      ...notification,
      id: Date.now().toString(),
      read: false,
      createdAt: new Date().toISOString(),
    };
    setNotifications((prev) => [newNotification, ...prev]);
  };

  const handleNotificationClick = (notification: Notification) => {
    // Navigate to the deliverable
    const deliverable = deliverables.find((d) => d.id === notification.deliverableId);
    if (deliverable) {
      setSelectedCampaign(deliverable.campaignId);
      setActiveView("campaigns");
      // Scroll to deliverable or expand it
      setTimeout(() => {
        const element = document.getElementById(`deliverable-${deliverable.id}`);
        if (element) {
          element.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }, 100);
    }
  };

  const handleMarkAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const filteredDeliverables = selectedCampaign
    ? deliverables.filter((d) => d.campaignId === selectedCampaign)
    : [];

  const sidebarItems = [
    { label: "Campaigns", href: "#", onClick: () => setActiveView("campaigns"), viewKey: "campaigns" },
    { label: "Metrics", href: "#", onClick: () => setActiveView("metrics"), viewKey: "metrics" },
    { label: "Social Media Metrics", href: "#", onClick: () => setActiveView("social"), viewKey: "social" },
  ];

  // Initialize with mock notifications
  useEffect(() => {
    if (deliverables.length > 0) {
      setNotifications([
        {
          id: "1",
          type: "new_content",
          title: "New Content Uploaded",
          message: "New content has been uploaded for Deliverable 1",
          deliverableId: "1",
          campaignId: "1",
          createdAt: new Date(Date.now() - 3600000).toISOString(),
          read: false,
        },
      ]);
    }
  }, []);

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
              <NotificationBar
                notifications={notifications}
                onNotificationClick={handleNotificationClick}
                onMarkAsRead={handleMarkAsRead}
              />
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

            {selectedCampaign ? (
              <div>
                <h3 className="text-2xl font-bold text-slate-800 mb-6">
                  Deliverables for {campaigns.find((c) => c.id === selectedCampaign)?.name}
                </h3>
                {filteredDeliverables.length === 0 ? (
                  <div className="bg-white/80 backdrop-blur-sm p-16 rounded-2xl shadow-soft text-center border border-gray-200">
                    <div className="w-20 h-20 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <svg className="w-10 h-10 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                      </svg>
                    </div>
                    <p className="text-gray-600 text-lg font-semibold mb-2">No deliverables found</p>
                    <p className="text-gray-400 text-sm">This campaign doesn't have any deliverables yet</p>
                  </div>
                ) : (
                  <BrandDeliverablesTable
                    deliverables={filteredDeliverables}
                    onStatusChange={handleStatusChange}
                    onCommentAdd={handleCommentAdd}
                    onEdit={handleEdit}
                  />
                )}
              </div>
            ) : (
              <div className="bg-white/80 backdrop-blur-sm p-16 rounded-2xl shadow-soft text-center border border-gray-200">
                <div className="w-20 h-20 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <svg className="w-10 h-10 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <p className="text-gray-600 text-lg font-semibold mb-2">Select a Campaign</p>
                <p className="text-gray-400 text-sm">Choose a campaign from above to view deliverables</p>
              </div>
            )}
          </div>
        )}

        {activeView === "metrics" && (
          <div>
            <h2 className="text-3xl font-bold text-slate-800 mb-6">Campaign Metrics</h2>
            <CampaignMetrics campaigns={campaigns} deliverables={deliverables} />
          </div>
        )}

        {activeView === "social" && (
          <div>
            <SocialMediaMetrics metrics={socialMetrics} />
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
            <BrandEditDeliverableForm
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

