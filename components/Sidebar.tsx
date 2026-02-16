"use client";

import { useRouter } from "next/navigation";

interface SidebarProps {
  role: "admin" | "brand";
  items: { label: string; href: string; icon?: string; onClick?: () => void; viewKey?: string }[];
  activeView?: string;
}

export default function Sidebar({ role, items, activeView }: SidebarProps) {
  const router = useRouter();

  const getIcon = (label: string) => {
    const icons: Record<string, string> = {
      "Brands": "🏢",
      "Campaigns": "📊",
      "Deliverables": "📦",
      "Metrics": "📈",
      "Social Media Metrics": "📱",
    };
    return icons[label] || "•";
  };

  return (
    <div className="w-72 bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 text-white min-h-screen p-6 shadow-2xl border-r border-slate-700/50">
      <div className="mb-10">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div>
            <h2 className="text-xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
              {role === "admin" ? "Admin" : "Brand"}
            </h2>
            <p className="text-xs text-gray-400">Dashboard</p>
          </div>
        </div>
      </div>
      <nav className="space-y-2">
        {items.map((item) => {
          const isActive = activeView && item.viewKey === activeView;
          return (
            <button
              key={item.href}
              onClick={() => {
                if (item.onClick) {
                  item.onClick();
                } else if (item.href !== "#") {
                  router.push(item.href);
                }
              }}
              className={`group relative w-full text-left px-4 py-3.5 rounded-xl transition-all duration-200 ${
                isActive
                  ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/50 transform scale-105"
                  : "text-gray-300 hover:bg-slate-700/50 hover:text-white hover:translate-x-1"
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-xl">{getIcon(item.label)}</span>
                <span className="font-semibold">{item.label}</span>
              </div>
              {isActive && (
                <div className="absolute right-2 top-1/2 transform -translate-y-1/2 w-2 h-2 bg-white rounded-full"></div>
              )}
            </button>
          );
        })}
        <div className="pt-4 mt-4 border-t border-slate-700/50">
          <button
            onClick={() => router.push("/login")}
            className="w-full text-left px-4 py-3.5 rounded-xl transition-all duration-200 text-gray-300 hover:bg-red-500/20 hover:text-red-300 hover:translate-x-1 flex items-center gap-3 group"
          >
            <svg className="w-5 h-5 group-hover:rotate-12 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span className="font-semibold">Logout</span>
          </button>
        </div>
      </nav>
    </div>
  );
}

