export type UserRole = "admin" | "brand";

export interface Brand {
  id: string;
  name: string;
  poc: string;
  email: string;
  contactNumber: string;
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

export interface Deliverable {
  id: string;
  name: string;
  postType: PostType;
  files: File[];
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

