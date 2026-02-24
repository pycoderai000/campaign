"use client";

import { useState, useEffect, useCallback } from "react";
import Sidebar from "@/components/Sidebar";
import NotificationBar from "@/components/NotificationBar";
import Modal from "@/components/Modal";
import CreateBrandForm from "@/components/CreateBrandForm";
import CreateCampaignForm from "@/components/CreateCampaignForm";
import ExcelDeliverablesTable from "@/components/ExcelDeliverablesTable";
import DeliverablesTable from "@/components/DeliverablesTable";
import CampaignMetrics from "@/components/CampaignMetrics";
import EditDeliverableForm from "@/components/EditDeliverableForm";
import ContentCalendar from "@/components/ContentCalendar";
import type { Brand, Campaign, Deliverable, Notification, FileOrUrl } from "@/types";
import { api, uploadFiles } from "@/lib/api";

function isFile(f: FileOrUrl): f is File {
  return f instanceof File;
}

export default function AdminDashboard() {
  const [activeView, setActiveView] = useState<"brands" | "campaigns" | "deliverables" | "metrics" | "calendar">("brands");
  const [selectedCampaignForCalendar, setSelectedCampaignForCalendar] = useState<Campaign | null>(null);
  const [showCreateBrand, setShowCreateBrand] = useState(false);
  const [showCreateCampaign, setShowCreateCampaign] = useState(false);
  const [showCreateDeliverable, setShowCreateDeliverable] = useState(false);
  const [showEditDeliverable, setShowEditDeliverable] = useState(false);
  const [editingDeliverable, setEditingDeliverable] = useState<Deliverable | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [brands, setBrands] = useState<Brand[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [deliverables, setDeliverables] = useState<Deliverable[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [metaInstagramStatus, setMetaInstagramStatus] = useState<{ configured: boolean; hasInstagram: boolean; message: string } | null>(null);
  const [syncingBrandId, setSyncingBrandId] = useState<string | null>(null);

  const fetchBrands = useCallback(async () => {
    try {
      const data = await api.get<Brand[]>("/api/brands");
      setBrands(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load brands");
    }
  }, []);

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

  const fetchMetaInstagramStatus = useCallback(async () => {
    try {
      const data = await api.get<{ configured: boolean; hasInstagram: boolean; message: string }>("/api/sync/instagram/status");
      setMetaInstagramStatus(data);
    } catch {
      setMetaInstagramStatus(null);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      await Promise.all([fetchBrands(), fetchCampaigns(), fetchDeliverables(), fetchNotifications(), fetchMetaInstagramStatus()]);
      if (!cancelled) setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [fetchBrands, fetchCampaigns, fetchDeliverables, fetchNotifications, fetchMetaInstagramStatus]);

  const sidebarItems = [
    { label: "Brands", href: "#", onClick: () => setActiveView("brands"), viewKey: "brands" },
    { label: "Campaigns", href: "#", onClick: () => setActiveView("campaigns"), viewKey: "campaigns" },
    { label: "Deliverables", href: "#", onClick: () => setActiveView("deliverables"), viewKey: "deliverables" },
    { label: "Metrics", href: "#", onClick: () => setActiveView("metrics"), viewKey: "metrics" },
    { label: "Content Calendar", href: "#", onClick: () => setActiveView("calendar"), viewKey: "calendar" },
  ];

  const handleCreateBrand = async (brandData: Omit<Brand, "id" | "createdAt">) => {
    try {
      await api.post<Brand>("/api/brands", brandData);
      setShowCreateBrand(false);
      await fetchBrands();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed to create brand");
    }
  };

  const handleCreateCampaign = async (campaignData: Omit<Campaign, "id" | "createdAt">) => {
    try {
      await api.post<Campaign>("/api/campaigns", campaignData);
      setShowCreateCampaign(false);
      await fetchCampaigns();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed to create campaign");
    }
  };

  const handleCreateDeliverables = async (newDeliverables: Deliverable[]) => {
    try {
      const payload: { name: string; postType: string; caption: string; postingDate: string; postingTime: string; campaignId: string; fileUrls: string[]; status: string }[] = [];
      for (const d of newDeliverables) {
        const campaign = campaigns.find((c) => c.id === d.campaignId);
        let fileUrls: string[] = [];
        const files = Array.isArray(d.files) ? d.files : [];
        const toUpload = files.filter(isFile);
        const existingUrls = files.filter((f): f is string => typeof f === "string");
        if (toUpload.length > 0) {
          const { urls } = await uploadFiles(toUpload);
          fileUrls = urls;
        } else {
          fileUrls = existingUrls;
        }
        payload.push({
          name: d.name,
          postType: d.postType,
          caption: d.caption,
          postingDate: d.postingDate,
          postingTime: d.postingTime,
          campaignId: d.campaignId,
          fileUrls,
          status: d.status,
        });
      }
      await api.post<Deliverable[]>("/api/deliverables", payload);
      setShowCreateDeliverable(false);
      await Promise.all([fetchDeliverables(), fetchNotifications()]);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed to create deliverables");
    }
  };

  const handleUpdateDeliverable = async (updated: Deliverable) => {
    try {
      const files = Array.isArray(updated.files) ? updated.files : [];
      const toUpload = files.filter(isFile);
      let fileUrls: string[] = files.filter((f): f is string => typeof f === "string");
      if (toUpload.length > 0) {
        const { urls } = await uploadFiles(toUpload);
        fileUrls = [...fileUrls, ...urls];
      }
      await api.patch<Deliverable>(`/api/deliverables/${updated.id}`, {
        name: updated.name,
        postType: updated.postType,
        caption: updated.caption,
        postingDate: updated.postingDate,
        postingTime: updated.postingTime,
        liveLink: updated.liveLink || "",
        status: updated.status,
        fileUrls,
      });
      setShowEditDeliverable(false);
      setEditingDeliverable(null);
      await Promise.all([fetchDeliverables(), fetchNotifications()]);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed to update deliverable");
    }
  };

  const handleEditDeliverable = (deliverable: Deliverable) => {
    setEditingDeliverable(deliverable);
    setShowEditDeliverable(true);
  };

  const handleSyncInstagram = async (brandId: string) => {
    if (metaInstagramStatus && !metaInstagramStatus.hasInstagram) {
      alert(metaInstagramStatus.message);
      return;
    }
    setSyncingBrandId(brandId);
    try {
      const res = await api.post<{ ok: boolean; message?: string; followersCount?: number }>("/api/sync/instagram", { brandId });
      alert(res.message || "Instagram metrics synced.");
      await fetchMetaInstagramStatus();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Sync failed");
    } finally {
      setSyncingBrandId(null);
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    setActiveView("deliverables");
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

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="text-lg font-semibold text-slate-600">Loading…</div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <Sidebar
        role="admin"
        items={sidebarItems}
        activeView={activeView}
      />
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
                Admin Dashboard
              </h1>
              <p className="text-sm sm:text-base text-gray-600 font-medium">Manage brands, campaigns, and deliverables</p>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              <NotificationBar
                notifications={notifications}
                onNotificationClick={handleNotificationClick}
                onMarkAsRead={handleMarkAsRead}
              />
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {activeView === "brands" && (
          <div>
            <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-800">Brands</h2>
              <button
                onClick={() => setShowCreateBrand(true)}
                className="group flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95 font-semibold text-sm sm:text-base"
              >
                <svg className="w-4 h-4 sm:w-5 sm:h-5 group-hover:rotate-90 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span className="hidden sm:inline">Create Brand</span>
                <span className="sm:hidden">Create</span>
              </button>
            </div>
            {brands.length === 0 ? (
              <div className="bg-white/80 backdrop-blur-sm p-16 rounded-2xl shadow-soft text-center border border-gray-200">
                <div className="w-20 h-20 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <svg className="w-10 h-10 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <p className="text-gray-600 text-lg font-semibold mb-2">No brands yet</p>
                <p className="text-gray-400">Create your first brand to get started</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {brands.map((brand) => (
                  <div
                    key={brand.id}
                    className="group bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-soft hover:shadow-hover transition-all duration-300 border border-gray-200 hover:border-indigo-300 transform hover:-translate-y-1"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                        <span className="text-2xl">🏢</span>
                      </div>
                      <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs font-semibold">Active</span>
                    </div>
                    <h3 className="text-xl font-bold text-slate-800 mb-4 group-hover:text-indigo-600 transition-colors">
                      {brand.name}
                    </h3>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 text-sm">
                        <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                          <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-gray-500 text-xs">Point of Contact</p>
                          <p className="text-gray-800 font-semibold">{brand.poc}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 text-sm">
                        <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                          <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-gray-500 text-xs">Email</p>
                          <p className="text-gray-800 font-semibold">{brand.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 text-sm">
                        <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                          <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-gray-500 text-xs">Contact</p>
                          <p className="text-gray-800 font-semibold">{brand.contactNumber}</p>
                        </div>
                      </div>
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <button
                          type="button"
                          onClick={() => handleSyncInstagram(brand.id)}
                          disabled={!!syncingBrandId || (metaInstagramStatus !== null && !metaInstagramStatus.configured)}
                          title={metaInstagramStatus && !metaInstagramStatus.hasInstagram ? metaInstagramStatus.message : undefined}
                          className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-medium bg-gradient-to-r from-pink-500 to-purple-600 text-white hover:from-pink-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        >
                          {syncingBrandId === brand.id ? "Syncing…" : "Sync Instagram"}
                        </button>
                        {metaInstagramStatus && !metaInstagramStatus.hasInstagram && metaInstagramStatus.configured && (
                          <p className="mt-2 text-xs text-amber-600 line-clamp-2">{metaInstagramStatus.message}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeView === "campaigns" && (
          <div>
            <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-800">Campaigns</h2>
              <button
                onClick={() => {
                  if (brands.length === 0) {
                    alert("Please create a brand first before creating a campaign");
                    return;
                  }
                  setShowCreateCampaign(true);
                }}
                className={`group flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl transition-all duration-200 font-semibold text-sm sm:text-base ${
                  brands.length === 0
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                    : "bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700 shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95"
                }`}
                disabled={brands.length === 0}
                title={brands.length === 0 ? "Create a brand first" : ""}
              >
                <svg className="w-4 h-4 sm:w-5 sm:h-5 group-hover:rotate-90 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span className="hidden sm:inline">Create Campaign</span>
                <span className="sm:hidden">Create</span>
              </button>
            </div>
            {campaigns.length === 0 ? (
              <div className="bg-white/80 backdrop-blur-sm p-16 rounded-2xl shadow-soft text-center border border-gray-200">
                <div className="w-20 h-20 bg-gradient-to-br from-purple-100 to-pink-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <svg className="w-10 h-10 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <p className="text-gray-600 text-lg font-semibold mb-2">No campaigns yet</p>
                <p className="text-gray-400">Create your first campaign to get started</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {campaigns.map((campaign) => {
                  const typeColors: Record<string, string> = {
                    LinkedIn: "from-blue-500 to-blue-600",
                    Instagram: "from-pink-500 to-purple-600",
                    YouTube: "from-red-500 to-red-600",
                    TikTok: "from-gray-800 to-gray-900",
                  };
                  return (
                    <div
                      key={campaign.id}
                      className="group bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-soft hover:shadow-hover transition-all duration-300 border border-gray-200 hover:border-indigo-300 transform hover:-translate-y-1"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className={`w-12 h-12 bg-gradient-to-br ${typeColors[campaign.type] || "from-indigo-500 to-purple-600"} rounded-xl flex items-center justify-center shadow-lg`}>
                          <span className="text-2xl">
                            {campaign.type === "LinkedIn" ? "💼" : campaign.type === "Instagram" ? "📷" : campaign.type === "YouTube" ? "📺" : "🎵"}
                          </span>
                        </div>
                        <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">Active</span>
                      </div>
                      <h3 className="text-xl font-bold text-slate-800 mb-3 group-hover:text-indigo-600 transition-colors">
                        {campaign.name}
                      </h3>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm">
                          <span className="text-gray-500 font-medium">Platform:</span>
                          <span className="text-gray-800 font-semibold">{campaign.type}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <span className="text-gray-500 font-medium">Brand:</span>
                          <span className="text-gray-800 font-semibold">{campaign.brandName}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {activeView === "deliverables" && (
          <div>
            <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-800">Deliverables</h2>
              <button
                onClick={() => {
                  if (campaigns.length === 0) {
                    alert("Please create a campaign first before creating a deliverable");
                    return;
                  }
                  setShowCreateDeliverable(true);
                }}
                className={`group flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl transition-all duration-200 font-semibold text-sm sm:text-base ${
                  campaigns.length === 0
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                    : "bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700 shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95"
                }`}
                disabled={campaigns.length === 0}
                title={campaigns.length === 0 ? "Create a campaign first" : ""}
              >
                <svg className="w-4 h-4 sm:w-5 sm:h-5 group-hover:rotate-90 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span className="hidden sm:inline">Add Deliverable</span>
                <span className="sm:hidden">Add</span>
              </button>
            </div>
            {showCreateDeliverable ? (
              <ExcelDeliverablesTable
                campaigns={campaigns}
                onSave={handleCreateDeliverables}
                onCancel={() => setShowCreateDeliverable(false)}
              />
            ) : (
              <DeliverablesTable
                deliverables={deliverables}
                onEdit={handleEditDeliverable}
                showComments={true}
              />
            )}
          </div>
        )}

        {activeView === "metrics" && (
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-800 mb-4 sm:mb-6">Campaign Metrics</h2>
            <CampaignMetrics campaigns={campaigns} deliverables={deliverables} />
          </div>
        )}

        {activeView === "calendar" && (
          <div>
            <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-800">Content Calendar</h2>
              {campaigns.length > 0 && (
                <select
                  value={selectedCampaignForCalendar?.id || ""}
                  onChange={(e) => {
                    const campaign = campaigns.find((c) => c.id === e.target.value);
                    setSelectedCampaignForCalendar(campaign || null);
                  }}
                  className="px-4 sm:px-6 py-2.5 sm:py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all bg-white font-semibold text-sm sm:text-base"
                >
                  <option value="">Select a Campaign</option>
                  {campaigns.map((campaign) => (
                    <option key={campaign.id} value={campaign.id}>
                      {campaign.name}
                    </option>
                  ))}
                </select>
              )}
            </div>
            {selectedCampaignForCalendar ? (
              <ContentCalendar
                deliverables={deliverables.filter((d) => d.campaignId === selectedCampaignForCalendar.id)}
                campaignName={selectedCampaignForCalendar.name}
              />
            ) : campaigns.length === 0 ? (
              <div className="bg-white/80 backdrop-blur-sm p-16 rounded-2xl shadow-soft text-center border border-gray-200">
                <div className="w-20 h-20 bg-gradient-to-br from-purple-100 to-pink-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <svg className="w-10 h-10 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <p className="text-gray-600 text-lg font-semibold mb-2">No campaigns yet</p>
                <p className="text-gray-400">Create a campaign first to view the content calendar</p>
              </div>
            ) : (
              <div className="bg-white/80 backdrop-blur-sm p-16 rounded-2xl shadow-soft text-center border border-gray-200">
                <div className="w-20 h-20 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <svg className="w-10 h-10 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <p className="text-gray-600 text-lg font-semibold mb-2">Select a Campaign</p>
                <p className="text-gray-400">Choose a campaign from the dropdown above to view its content calendar</p>
              </div>
            )}
          </div>
        )}

        <Modal
          isOpen={showCreateBrand}
          onClose={() => setShowCreateBrand(false)}
          title="Create Brand"
        >
          <CreateBrandForm onSubmit={handleCreateBrand} onCancel={() => setShowCreateBrand(false)} />
        </Modal>

        <Modal
          isOpen={showCreateCampaign}
          onClose={() => setShowCreateCampaign(false)}
          title="Create Campaign"
        >
          <CreateCampaignForm
            brands={brands}
            onSubmit={handleCreateCampaign}
            onCancel={() => setShowCreateCampaign(false)}
          />
        </Modal>

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

