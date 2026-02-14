"use client";

import { useState } from "react";
import Sidebar from "@/components/Sidebar";
import Modal from "@/components/Modal";
import CreateBrandForm from "@/components/CreateBrandForm";
import CreateCampaignForm from "@/components/CreateCampaignForm";
import CreateDeliverableForm from "@/components/CreateDeliverableForm";
import DeliverablesTable from "@/components/DeliverablesTable";
import CampaignMetrics from "@/components/CampaignMetrics";
import type { Brand, Campaign, Deliverable } from "@/types";

export default function AdminDashboard() {
  const [activeView, setActiveView] = useState<"brands" | "campaigns" | "deliverables" | "metrics">("brands");
  const [showCreateBrand, setShowCreateBrand] = useState(false);
  const [showCreateCampaign, setShowCreateCampaign] = useState(false);
  const [showCreateDeliverable, setShowCreateDeliverable] = useState(false);
  
  // Mock data - replace with actual API calls
  const [brands, setBrands] = useState<Brand[]>([
    { id: "1", name: "Brand 1", poc: "John Doe", email: "john@brand1.com", contactNumber: "1234567890", createdAt: new Date().toISOString() },
  ]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [deliverables, setDeliverables] = useState<Deliverable[]>([]);

  const sidebarItems = [
    { label: "Brands", href: "#", onClick: () => setActiveView("brands"), viewKey: "brands" },
    { label: "Campaigns", href: "#", onClick: () => setActiveView("campaigns"), viewKey: "campaigns" },
    { label: "Deliverables", href: "#", onClick: () => setActiveView("deliverables"), viewKey: "deliverables" },
    { label: "Metrics", href: "#", onClick: () => setActiveView("metrics"), viewKey: "metrics" },
  ];

  const handleCreateBrand = (brandData: Omit<Brand, "id" | "createdAt">) => {
    const newBrand: Brand = {
      ...brandData,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    };
    setBrands([...brands, newBrand]);
    setShowCreateBrand(false);
  };

  const handleCreateCampaign = (campaignData: Omit<Campaign, "id" | "createdAt">) => {
    const newCampaign: Campaign = {
      ...campaignData,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    };
    setCampaigns([...campaigns, newCampaign]);
    setShowCreateCampaign(false);
  };

  const handleCreateDeliverable = (deliverableData: Omit<Deliverable, "id" | "createdAt" | "comments">) => {
    const newDeliverable: Deliverable = {
      ...deliverableData,
      id: Date.now().toString(),
      comments: [],
      createdAt: new Date().toISOString(),
    };
    setDeliverables([...deliverables, newDeliverable]);
    setShowCreateDeliverable(false);
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <Sidebar
        role="admin"
        items={sidebarItems}
        activeView={activeView}
      />
      <div className="flex-1 p-8 overflow-auto">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent mb-2">
                Admin Dashboard
              </h1>
              <p className="text-gray-600 font-medium">Manage brands, campaigns, and deliverables</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {activeView === "brands" && (
          <div>
            <div className="mb-6 flex justify-between items-center">
              <h2 className="text-3xl font-bold text-slate-800">Brands</h2>
              <button
                onClick={() => setShowCreateBrand(true)}
                className="group flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95 font-semibold"
              >
                <svg className="w-5 h-5 group-hover:rotate-90 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Create Brand
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
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeView === "campaigns" && (
          <div>
            <div className="mb-6 flex justify-between items-center">
              <h2 className="text-3xl font-bold text-slate-800">Campaigns</h2>
              <button
                onClick={() => {
                  if (brands.length === 0) {
                    alert("Please create a brand first before creating a campaign");
                    return;
                  }
                  setShowCreateCampaign(true);
                }}
                className={`group flex items-center gap-2 px-6 py-3 rounded-xl transition-all duration-200 font-semibold ${
                  brands.length === 0
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                    : "bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700 shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95"
                }`}
                disabled={brands.length === 0}
                title={brands.length === 0 ? "Create a brand first" : ""}
              >
                <svg className="w-5 h-5 group-hover:rotate-90 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Create Campaign
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
            <div className="mb-6 flex justify-between items-center">
              <h2 className="text-3xl font-bold text-slate-800">Deliverables</h2>
              <button
                onClick={() => {
                  if (campaigns.length === 0) {
                    alert("Please create a campaign first before creating a deliverable");
                    return;
                  }
                  setShowCreateDeliverable(true);
                }}
                className={`group flex items-center gap-2 px-6 py-3 rounded-xl transition-all duration-200 font-semibold ${
                  campaigns.length === 0
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                    : "bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700 shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95"
                }`}
                disabled={campaigns.length === 0}
                title={campaigns.length === 0 ? "Create a campaign first" : ""}
              >
                <svg className="w-5 h-5 group-hover:rotate-90 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Create Deliverable
              </button>
            </div>
            <DeliverablesTable deliverables={deliverables} />
          </div>
        )}

        {activeView === "metrics" && (
          <div>
            <h2 className="text-3xl font-bold text-slate-800 mb-6">Campaign Metrics</h2>
            <CampaignMetrics campaigns={campaigns} deliverables={deliverables} />
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
          isOpen={showCreateDeliverable}
          onClose={() => setShowCreateDeliverable(false)}
          title="Create Deliverable"
        >
          <CreateDeliverableForm
            campaigns={campaigns}
            brands={brands}
            onSubmit={handleCreateDeliverable}
            onCancel={() => setShowCreateDeliverable(false)}
          />
        </Modal>
      </div>
    </div>
  );
}

