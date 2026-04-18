export type UserRole = "admin" | "brand";
export type BrandMonitoringSourceType = "website" | "news" | "leadership";

export interface BrandMonitoringSource {
  id?: string;
  name: string;
  sourceType: BrandMonitoringSourceType;
  sourceUrl?: string;
  query?: string;
  isActive?: boolean;
  sortOrder?: number;
  lastCheckedAt?: string;
  lastUsedApifyAt?: string;
  lastError?: string;
}

export interface BrandScrapedItem {
  id: string;
  brandId: string;
  sourceId?: string;
  sourceType: BrandMonitoringSourceType;
  title: string;
  summary?: string;
  url: string;
  imageUrl?: string;
  publisher?: string;
  publishedAt?: string;
  createdAt: string;
}

export interface Brand {
  id: string;
  name: string;
  poc: string;
  email: string;
  contactNumber: string;
  contentBucket?: string; // legacy single-bucket field
  contentBuckets?: string[];
  monitoringEnabled?: boolean;
  monitoringTime?: string;
  monitoringLastRunAt?: string;
  monitoringSources?: BrandMonitoringSource[];
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
  contentBucket?: string;
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

