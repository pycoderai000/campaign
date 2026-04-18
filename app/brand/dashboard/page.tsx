"use client";

import { useState, useEffect, useCallback } from "react";
import Sidebar from "@/components/Sidebar";
import BrandDeliverablesTable from "@/components/BrandDeliverablesTable";
import CampaignMetrics from "@/components/CampaignMetrics";
import SocialMediaMetrics from "@/components/SocialMediaMetrics";
import ContentCalendar from "@/components/ContentCalendar";
import BrandMonitoringFeed from "@/components/BrandMonitoringFeed";
import NotificationBar from "@/components/NotificationBar";
import Modal from "@/components/Modal";
import BrandEditDeliverableForm from "@/components/BrandEditDeliverableForm";
import BrandRequestRevisionForm from "@/components/BrandRequestRevisionForm";
import DeliverableDetailModal from "@/components/DeliverableDetailModal";
import type {
  BrandScrapedItem,
  Campaign,
  Deliverable,
  DeliverableStatus,
  Notification,
  SocialMediaMetrics as SocialMediaMetricsType,
} from "@/types";
import { api, uploadFiles } from "@/lib/api";
import { defaultSocialMetrics } from "@/lib/social-metrics-defaults";

export default function BrandDashboard() {
  const [activeView, setActiveView] = useState<"campaigns" | "feed" | "metrics" | "social" | "calendar">("campaigns");
  const [selectedCampaign, setSelectedCampaign] = useState<string | null>(null);
  const [selectedCampaignForCalendar, setSelectedCampaignForCalendar] = useState<string | null>(null);
  const [showEditDeliverable, setShowEditDeliverable] = useState(false);
  const [editingDeliverable, setEditingDeliverable] = useState<Deliverable | null>(null);
  const [showRequestRevision, setShowRequestRevision] = useState(false);
  const [revisionDeliverable, setRevisionDeliverable] = useState<Deliverable | null>(null);
  const [deliverableDetailId, setDeliverableDetailId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [deliverables, setDeliverables] = useState<Deliverable[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [socialMetrics, setSocialMetrics] = useState<SocialMediaMetricsType | null>(null);
  const [feedItems, setFeedItems] = useState<BrandScrapedItem[]>([]);

  const fetchCampaigns = useCallback(async () => {
    try {
      const data = await api.get<Campaign[]>("/api/campaigns");
      setCampaigns(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load campaigns");
    }
  }, []);

  const fetchDeliverables = useCallback(async () => {
    try {
      const data = await api.get<Deliverable[]>("/api/deliverables");
      setDeliverables(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load deliverables");
    }
  }, []);

  const fetchNotifications = useCallback(async () => {
    try {
      const data = await api.get<Notification[]>("/api/notifications");
      setNotifications(Array.isArray(data) ? data : []);
    } catch {
      // non-blocking
    }
  }, []);

  const fetchSocialMetrics = useCallback(async () => {
    try {
      const data = await api.get<{ platform: string; followersCount: number; engagementRate: number; seriesData?: { followers?: { month: string; count: number }[]; engagementGrowth?: { month: string; growth: number }[] } }[]>(
        "/api/social-metrics"
      );
      if (!Array.isArray(data) || data.length === 0) {
        setSocialMetrics(null);
        return;
      }
      const byPlatform: SocialMediaMetricsType = {};
      for (const row of data) {
        const key = row.platform as "instagram" | "youtube" | "tiktok";
        if (!byPlatform[key]) {
          byPlatform[key] = {
            followers: row.seriesData?.followers ?? [],
            engagementGrowth: row.seriesData?.engagementGrowth ?? [],
            totalFollowers: row.followersCount,
            engagementRate: row.engagementRate,
          };
        }
      }
      setSocialMetrics(byPlatform);
    } catch {
      setSocialMetrics(null);
    }
  }, []);

  const fetchFeedItems = useCallback(async () => {
    try {
      const data = await api.get<{ items: BrandScrapedItem[] }>("/api/monitoring");
      setFeedItems(Array.isArray(data?.items) ? data.items : []);
    } catch {
      setFeedItems([]);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      await Promise.all([fetchCampaigns(), fetchDeliverables(), fetchNotifications(), fetchSocialMetrics(), fetchFeedItems()]);
      if (!cancelled) setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [fetchCampaigns, fetchDeliverables, fetchNotifications, fetchSocialMetrics, fetchFeedItems]);

  useEffect(() => {
    const t = setInterval(() => {
      fetchNotifications();
    }, 60_000);
    return () => clearInterval(t);
  }, [fetchNotifications]);

  const handleStatusChange = async (id: string, status: DeliverableStatus) => {
    try {
      await api.patch(`/api/deliverables/${id}`, { status });
      await fetchDeliverables();
      await fetchNotifications();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed to update status");
    }
  };

  const handleCommentAdd = async (id: string, comment: string) => {
    try {
      await api.post(`/api/deliverables/${id}/comments`, { text: comment });
      await fetchDeliverables();
      await fetchNotifications();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed to add comment");
    }
  };

  const handleEdit = async (deliverable: Deliverable) => {
    try {
      const full = await api.get<Deliverable>(`/api/deliverables/${deliverable.id}`);
      setEditingDeliverable(full);
    } catch {
      setEditingDeliverable(deliverable);
    }
    setShowEditDeliverable(true);
  };

  const openRequestRevision = async (deliverable: Deliverable) => {
    try {
      const full = await api.get<Deliverable>(`/api/deliverables/${deliverable.id}`);
      setRevisionDeliverable(full);
    } catch {
      setRevisionDeliverable(deliverable);
    }
    setShowRequestRevision(true);
  };

  const handleUpdateDeliverable = async (data: Partial<Deliverable>) => {
    if (!data.id) return;
    try {
      await api.patch(`/api/deliverables/${data.id}`, {
        caption: data.caption,
        postingDate: data.postingDate,
        postingTime: data.postingTime,
        status: data.status,
      });
      setShowEditDeliverable(false);
      setEditingDeliverable(null);
      await Promise.all([fetchDeliverables(), fetchNotifications()]);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed to update deliverable");
    }
  };

  const handleSubmitRevision = async (payload: { revisionNote: string; newFiles?: File[]; caption?: string }) => {
    if (!revisionDeliverable?.id) return;
    try {
      let newFileUrls: string[] | undefined;
      if (payload.newFiles && payload.newFiles.length > 0) {
        const { urls } = await uploadFiles(payload.newFiles);
        newFileUrls = urls;
      }
      await api.patch(`/api/deliverables/${revisionDeliverable.id}`, {
        caption: payload.caption,
        revisionNote: payload.revisionNote,
        newFileUrls,
      });
      setShowRequestRevision(false);
      setRevisionDeliverable(null);
      await Promise.all([fetchDeliverables(), fetchNotifications()]);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed to submit revision request");
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    setSelectedCampaign(notification.campaignId || null);
    setActiveView("campaigns");
    setTimeout(() => {
      const element = document.getElementById(`deliverable-${notification.deliverableId}`);
      if (element) element.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 100);
  };

  const handleMarkAsRead = async (id: string) => {
    try {
      await api.patch(`/api/notifications/${id}/read`, {});
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    } catch {
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    }
  };

  const filteredDeliverables = selectedCampaign
    ? [...deliverables.filter((d) => d.campaignId === selectedCampaign)].sort((a, b) => {
        const left = new Date(`${a.postingDate}T${a.postingTime || "00:00"}`);
        const right = new Date(`${b.postingDate}T${b.postingTime || "00:00"}`);
        return left.getTime() - right.getTime();
      })
    : [];

  const sidebarItems = [
    { label: "Campaigns", href: "#", onClick: () => setActiveView("campaigns"), viewKey: "campaigns" },
    { label: "Web Feed", href: "#", onClick: () => setActiveView("feed"), viewKey: "feed" },
    { label: "Metrics", href: "#", onClick: () => setActiveView("metrics"), viewKey: "metrics" },
    { label: "Social Media Metrics", href: "#", onClick: () => setActiveView("social"), viewKey: "social" },
    { label: "Content Calendar", href: "#", onClick: () => setActiveView("calendar"), viewKey: "calendar" },
  ];

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="text-lg font-semibold text-slate-600">Loading…</div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <Sidebar role="brand" items={sidebarItems} activeView={activeView} />
      <div className="flex-1 p-4 sm:p-6 lg:p-8 overflow-auto lg:ml-0">
        {error && (
          <div className="mb-4 p-4 rounded-xl bg-red-50 text-red-700 font-medium">
            {error}
          </div>
        )}
        <div className="mb-6 lg:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent mb-2">
                Brand Dashboard
              </h1>
              <p className="text-sm sm:text-base text-gray-600 font-medium">Manage your campaigns and deliverables</p>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              <NotificationBar
                notifications={notifications}
                onNotificationClick={handleNotificationClick}
                onMarkAsRead={handleMarkAsRead}
              />
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-xl sm:text-2xl">🏢</span>
              </div>
            </div>
          </div>
        </div>

        {activeView === "feed" && (
          <div>
            <div className="mb-4 sm:mb-6">
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-800 mb-2">Web Feed</h2>
              <p className="text-sm sm:text-base text-gray-600">
                Daily monitored content from the websites, news sources, and leadership pages configured for your brand.
              </p>
            </div>
            <BrandMonitoringFeed items={feedItems} />
          </div>
        )}

        {activeView === "campaigns" && (
          <div>
            <div className="mb-6 lg:mb-8">
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-800 mb-4 sm:mb-6">Campaigns</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mb-4 sm:mb-6">
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
                      className={`group p-4 sm:p-6 rounded-xl sm:rounded-2xl border-2 transition-all duration-200 text-left transform hover:scale-[1.02] sm:hover:scale-105 ${
                        isSelected
                          ? "border-indigo-500 bg-gradient-to-br from-indigo-50 to-purple-50 shadow-lg"
                          : "border-gray-200 bg-white/80 backdrop-blur-sm hover:border-indigo-300 hover:shadow-md"
                      }`}
                    >
                      <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                        <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                          isSelected
                            ? `bg-gradient-to-br ${typeColors[campaign.type] || "from-indigo-500 to-purple-600"}`
                            : "bg-gray-100"
                        }`}>
                          <span className="text-xl sm:text-2xl">
                            {campaign.type === "LinkedIn" ? "💼" : campaign.type === "Instagram" ? "📷" : campaign.type === "YouTube" ? "📺" : "🎵"}
                          </span>
                        </div>
                        <h3 className={`font-bold text-base sm:text-lg ${
                          isSelected ? "text-indigo-700" : "text-gray-800"
                        }`}>{campaign.name}</h3>
                      </div>
                      <p className={`text-xs sm:text-sm font-semibold ${
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
                <h3 className="text-xl sm:text-2xl font-bold text-slate-800 mb-4 sm:mb-6">
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
                    onRequestRevision={openRequestRevision}
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
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-800 mb-4 sm:mb-6">Campaign Metrics</h2>
            <CampaignMetrics campaigns={campaigns} deliverables={deliverables} />
          </div>
        )}

        {activeView === "social" && (
          <div>
            <SocialMediaMetrics metrics={socialMetrics ?? defaultSocialMetrics} />
          </div>
        )}

        {activeView === "calendar" && (
          <div>
            <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-800">Content Calendar</h2>
              {campaigns.length > 0 && (
                <select
                  value={selectedCampaignForCalendar ?? "all"}
                  onChange={(e) => {
                    const value = e.target.value;
                    setSelectedCampaignForCalendar(value === "all" ? null : value);
                  }}
                  className="px-4 sm:px-6 py-2.5 sm:py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all bg-white font-semibold text-sm sm:text-base"
                >
                  <option value="all">All campaigns</option>
                  {campaigns.map((campaign) => (
                    <option key={campaign.id} value={campaign.id}>
                      {campaign.name}
                    </option>
                  ))}
                </select>
              )}
            </div>
            {campaigns.length > 0 ? (
              <ContentCalendar
                key={selectedCampaignForCalendar || "all"}
                deliverables={
                  selectedCampaignForCalendar
                    ? deliverables.filter((d) => d.campaignId === selectedCampaignForCalendar)
                    : deliverables
                }
                campaignName={
                  selectedCampaignForCalendar
                    ? campaigns.find((c) => c.id === selectedCampaignForCalendar)?.name || "Selected Campaign"
                    : "All campaigns"
                }
                onDeliverableClick={(d) => setDeliverableDetailId(d.id)}
              />
            ) : (
              <div className="bg-white/80 backdrop-blur-sm p-16 rounded-2xl shadow-soft text-center border border-gray-200">
                <div className="w-20 h-20 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <svg className="w-10 h-10 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <p className="text-gray-600 text-lg font-semibold mb-2">No campaigns found</p>
                <p className="text-gray-400 text-sm">Campaign calendar will appear here once campaigns are available.</p>
              </div>
            )}
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
              key={editingDeliverable.id}
              deliverable={editingDeliverable}
              onSubmit={handleUpdateDeliverable}
              onCancel={() => {
                setShowEditDeliverable(false);
                setEditingDeliverable(null);
              }}
            />
          )}
        </Modal>
        <Modal
          isOpen={showRequestRevision}
          onClose={() => {
            setShowRequestRevision(false);
            setRevisionDeliverable(null);
          }}
          title="Request revision"
        >
          {revisionDeliverable && (
            <BrandRequestRevisionForm
              key={revisionDeliverable.id}
              deliverable={revisionDeliverable}
              onSubmit={handleSubmitRevision}
              onCancel={() => {
                setShowRequestRevision(false);
                setRevisionDeliverable(null);
              }}
            />
          )}
        </Modal>
        <DeliverableDetailModal
          deliverableId={deliverableDetailId}
          onClose={() => setDeliverableDetailId(null)}
          onEdit={(d) => {
            setDeliverableDetailId(null);
            setEditingDeliverable(d);
            setShowEditDeliverable(true);
          }}
          onRequestRevision={(d) => {
            setDeliverableDetailId(null);
            void openRequestRevision(d);
          }}
        />
      </div>
    </div>
  );
}

