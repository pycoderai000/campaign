export type UserRole = "admin" | "brand";

export interface Brand {
  id: string;
  name: string;
  poc: string;
  email: string;
  contactNumber: string;
  instagramLink?: string;
  instagramHandle?: string;
  youtubeLink?: string;
  youtubeHandle?: string;
  tiktokLink?: string;
  tiktokHandle?: string;
  createdAt: string;
}

export type CampaignType = "LinkedIn" | "Instagram" | "YouTube" | "TikTok";

export interface Campaign {
  id: string;
  name: string;
  type: CampaignType;
  brandId: string;
  brandName: string;
  createdAt: string;
}

export type PostType = "Static" | "Carousel" | "Video post";

export type DeliverableStatus =
  | "New content"
  | "In revision"
  | "Approved"
  | "Live"
  | "Cancelled";

export type FileOrUrl = File | string;

export interface ContentVersion {
  id: string;
  files: FileOrUrl[];
  uploadedAt: string;
  uploadedBy: string;
  revisionNote?: string;
}

export interface Revision {
  id: string;
  deliverableId: string;
  revisionNote: string;
  requestedBy: string;
  requestedAt: string;
  files?: FileOrUrl[];
}

export interface Deliverable {
  id: string;
  name: string;
  postType: PostType;
  files: FileOrUrl[];
  caption: string;
  postingDate: string;
  postingTime: string;
  liveLink?: string;
  campaignId: string;
  campaignName: string;
  brandId: string;
  brandName: string;
  status: DeliverableStatus;
  comments: Comment[];
  createdAt: string;
  contentHistory?: ContentVersion[];
  revisions?: Revision[];
}

export interface Comment {
  id: string;
  text: string;
  author: string;
  createdAt: string;
}

export interface PostMetrics {
  postId: string;
  impressions: number;
  reach: number;
  likes: number;
  comments: number;
  engagement: number;
  date: string;
}

export interface CampaignMetrics {
  campaignId: string;
  impressions: number;
  reach: number;
  likes: number;
  comments: number;
  engagement: number;
  date: string;
}

export interface Notification {
  id: string;
  type: "new_content" | "status_change" | "new_comment" | "revision";
  title: string;
  message: string;
  deliverableId: string;
  campaignId?: string;
  createdAt: string;
  read: boolean;
}

export interface SocialMediaMetrics {
  instagram?: {
    followers: { month: string; count: number }[];
    engagementGrowth: { month: string; growth: number }[];
    totalFollowers: number;
    engagementRate: number;
  };
  youtube?: {
    followers: { month: string; count: number }[];
    engagementGrowth: { month: string; growth: number }[];
    totalFollowers: number;
    engagementRate: number;
  };
  tiktok?: {
    followers: { month: string; count: number }[];
    engagementGrowth: { month: string; growth: number }[];
    totalFollowers: number;
    engagementRate: number;
  };
  // Legacy support
  followers?: { month: string; count: number }[];
  engagementGrowth?: { month: string; growth: number }[];
  totalFollowers?: number;
  engagementRate?: number;
}

