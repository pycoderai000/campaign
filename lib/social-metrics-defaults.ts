import type { SocialMediaMetrics } from "@/types";

export const defaultSocialMetrics: SocialMediaMetrics = {
  instagram: {
    followers: [{ month: "Jan", count: 10000 }, { month: "Jun", count: 25000 }],
    engagementGrowth: [{ month: "Jan", growth: 2.5 }, { month: "Jun", growth: 5.2 }],
    totalFollowers: 25000,
    engagementRate: 5.2,
  },
  youtube: {
    followers: [{ month: "Jan", count: 5000 }, { month: "Jun", count: 13000 }],
    engagementGrowth: [{ month: "Jan", growth: 1.8 }, { month: "Jun", growth: 3.6 }],
    totalFollowers: 13000,
    engagementRate: 3.6,
  },
  tiktok: {
    followers: [{ month: "Jan", count: 8000 }, { month: "Jun", count: 20000 }],
    engagementGrowth: [{ month: "Jan", growth: 3.0 }, { month: "Jun", growth: 5.5 }],
    totalFollowers: 20000,
    engagementRate: 5.5,
  },
};
