import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  boolean,
  integer,
  jsonb,
  pgEnum,
  index,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// Enums matching frontend types
export const userRoleEnum = pgEnum("user_role", ["admin", "brand"]);
export const campaignTypeEnum = pgEnum("campaign_type", [
  "LinkedIn",
  "Instagram",
  "YouTube",
  "TikTok",
]);
export const postTypeEnum = pgEnum("post_type", [
  "Static",
  "Carousel",
  "Video post",
]);
export const deliverableStatusEnum = pgEnum("deliverable_status", [
  "New content",
  "In revision",
  "Approved",
  "Live",
  "Cancelled",
]);
export const notificationTypeEnum = pgEnum("notification_type", [
  "new_content",
  "status_change",
  "new_comment",
  "revision",
]);
export const socialPlatformEnum = pgEnum("social_platform", [
  "instagram",
  "youtube",
  "tiktok",
]);
export const brandMonitoringSourceTypeEnum = pgEnum("brand_monitoring_source_type", [
  "website",
  "news",
  "leadership",
]);

// Users (for auth; brandId set for brand users)
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  hashedPassword: varchar("hashed_password", { length: 255 }).notNull(),
  role: userRoleEnum("role").notNull(),
  brandId: uuid("brand_id").references(() => brands.id, { onDelete: "set null" }),
  name: varchar("name", { length: 255 }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// Brands
export const brands = pgTable("brands", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  poc: varchar("poc", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull(),
  contactNumber: varchar("contact_number", { length: 50 }).notNull(),
  contentBucket: varchar("content_bucket", { length: 255 }),
  monitoringEnabled: boolean("monitoring_enabled").notNull().default(false),
  monitoringTime: varchar("monitoring_time", { length: 5 }).notNull().default("09:00"),
  monitoringLastRunAt: timestamp("monitoring_last_run_at", { withTimezone: true }),
  instagramLink: varchar("instagram_link", { length: 512 }),
  instagramHandle: varchar("instagram_handle", { length: 255 }),
  youtubeLink: varchar("youtube_link", { length: 512 }),
  youtubeHandle: varchar("youtube_handle", { length: 255 }),
  tiktokLink: varchar("tiktok_link", { length: 512 }),
  tiktokHandle: varchar("tiktok_handle", { length: 255 }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// Brand content buckets (one brand -> many bucket labels)
export const brandContentBuckets = pgTable(
  "brand_content_buckets",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    brandId: uuid("brand_id")
      .notNull()
      .references(() => brands.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 255 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index("brand_content_buckets_brand_id_idx").on(t.brandId)]
);

// Brand monitoring sources (news / websites / leadership sources a brand wants monitored daily)
export const brandMonitoringSources = pgTable(
  "brand_monitoring_sources",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    brandId: uuid("brand_id")
      .notNull()
      .references(() => brands.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 255 }).notNull(),
    sourceType: brandMonitoringSourceTypeEnum("source_type").notNull(),
    sourceUrl: varchar("source_url", { length: 1024 }),
    query: varchar("query", { length: 512 }),
    isActive: boolean("is_active").notNull().default(true),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index("brand_monitoring_sources_brand_id_idx").on(t.brandId),
    index("brand_monitoring_sources_brand_active_idx").on(t.brandId, t.isActive),
  ]
);

// Campaigns
export const campaigns = pgTable(
  "campaigns",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: varchar("name", { length: 255 }).notNull(),
    type: campaignTypeEnum("type").notNull(),
    brandId: uuid("brand_id")
      .notNull()
      .references(() => brands.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index("campaigns_brand_id_idx").on(t.brandId)]
);

// Deliverables (files stored in deliverable_files)
export const deliverables = pgTable(
  "deliverables",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: varchar("name", { length: 255 }).notNull(),
    postType: postTypeEnum("post_type").notNull(),
    contentBucket: varchar("content_bucket", { length: 255 }),
    caption: text("caption").notNull(),
    postingDate: varchar("posting_date", { length: 10 }).notNull(),
    postingTime: varchar("posting_time", { length: 10 }).notNull(),
    liveLink: varchar("live_link", { length: 512 }),
    campaignId: uuid("campaign_id")
      .notNull()
      .references(() => campaigns.id, { onDelete: "cascade" }),
    status: deliverableStatusEnum("status").notNull().default("New content"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index("deliverables_campaign_id_idx").on(t.campaignId),
    index("deliverables_status_idx").on(t.status),
  ]
);

// Deliverable file URLs (current files for a deliverable)
export const deliverableFiles = pgTable("deliverable_files", {
  id: uuid("id").primaryKey().defaultRandom(),
  deliverableId: uuid("deliverable_id")
    .notNull()
    .references(() => deliverables.id, { onDelete: "cascade" }),
  url: text("url").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
});

// Comments
export const comments = pgTable(
  "comments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    deliverableId: uuid("deliverable_id")
      .notNull()
      .references(() => deliverables.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    text: text("text").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index("comments_deliverable_id_idx").on(t.deliverableId)]
);

// Content versions (history of file sets per deliverable)
export const contentVersions = pgTable("content_versions", {
  id: uuid("id").primaryKey().defaultRandom(),
  deliverableId: uuid("deliverable_id")
    .notNull()
    .references(() => deliverables.id, { onDelete: "cascade" }),
  revisionNote: text("revision_note"),
  uploadedBy: uuid("uploaded_by")
    .notNull()
    .references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const contentVersionFiles = pgTable("content_version_files", {
  id: uuid("id").primaryKey().defaultRandom(),
  contentVersionId: uuid("content_version_id")
    .notNull()
    .references(() => contentVersions.id, { onDelete: "cascade" }),
  url: text("url").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
});

// Revisions (brand-requested changes with new files)
export const revisions = pgTable("revisions", {
  id: uuid("id").primaryKey().defaultRandom(),
  deliverableId: uuid("deliverable_id")
    .notNull()
    .references(() => deliverables.id, { onDelete: "cascade" }),
  revisionNote: text("revision_note").notNull(),
  requestedBy: uuid("requested_by")
    .notNull()
    .references(() => users.id, { onDelete: "set null" }),
  requestedAt: timestamp("requested_at", { withTimezone: true }).defaultNow().notNull(),
});

export const revisionFiles = pgTable("revision_files", {
  id: uuid("id").primaryKey().defaultRandom(),
  revisionId: uuid("revision_id")
    .notNull()
    .references(() => revisions.id, { onDelete: "cascade" }),
  url: text("url").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
});

// Notifications
export const notifications = pgTable(
  "notifications",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: notificationTypeEnum("type").notNull(),
    title: varchar("title", { length: 255 }).notNull(),
    message: text("message").notNull(),
    deliverableId: uuid("deliverable_id").references(() => deliverables.id, {
      onDelete: "set null",
    }),
    campaignId: uuid("campaign_id").references(() => campaigns.id, {
      onDelete: "set null",
    }),
    read: boolean("read").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index("notifications_user_id_idx").on(t.userId),
    index("notifications_user_read_idx").on(t.userId, t.read),
  ]
);

// Campaign metrics (aggregate per campaign per date)
export const campaignMetrics = pgTable(
  "campaign_metrics",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    campaignId: uuid("campaign_id")
      .notNull()
      .references(() => campaigns.id, { onDelete: "cascade" }),
    date: varchar("date", { length: 10 }).notNull(),
    impressions: integer("impressions").notNull().default(0),
    reach: integer("reach").notNull().default(0),
    likes: integer("likes").notNull().default(0),
    comments: integer("comments").notNull().default(0),
    engagement: integer("engagement").notNull().default(0),
  },
  (t) => [index("campaign_metrics_campaign_id_idx").on(t.campaignId)]
);

// Social metrics per brand per platform (time series in jsonb)
export const socialMetrics = pgTable(
  "social_metrics",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    brandId: uuid("brand_id")
      .notNull()
      .references(() => brands.id, { onDelete: "cascade" }),
    platform: socialPlatformEnum("platform").notNull(),
    period: varchar("period", { length: 20 }).notNull(),
    followersCount: integer("followers_count").notNull().default(0),
    engagementRate: integer("engagement_rate").notNull().default(0),
    seriesData: jsonb("series_data").$type<{
      followers?: { month: string; count: number }[];
      engagementGrowth?: { month: string; growth: number }[];
    }>(),
  },
  (t) => [index("social_metrics_brand_id_idx").on(t.brandId)]
);

// Scraped feed items shown on the brand dashboard
export const brandScrapedItems = pgTable(
  "brand_scraped_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    brandId: uuid("brand_id")
      .notNull()
      .references(() => brands.id, { onDelete: "cascade" }),
    sourceId: uuid("source_id").references(() => brandMonitoringSources.id, {
      onDelete: "set null",
    }),
    sourceType: brandMonitoringSourceTypeEnum("source_type").notNull(),
    title: varchar("title", { length: 512 }).notNull(),
    summary: text("summary"),
    url: varchar("url", { length: 2048 }).notNull(),
    imageUrl: varchar("image_url", { length: 2048 }),
    publisher: varchar("publisher", { length: 255 }),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    rawData: jsonb("raw_data").$type<Record<string, unknown> | null>(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index("brand_scraped_items_brand_id_idx").on(t.brandId),
    index("brand_scraped_items_source_id_idx").on(t.sourceId),
  ]
);

// Relations (for Drizzle queries with relational API)
export const usersRelations = relations(users, ({ one, many }) => ({
  brand: one(brands, {
    fields: [users.brandId],
    references: [brands.id],
  }),
  comments: many(comments),
  notifications: many(notifications),
}));

export const brandsRelations = relations(brands, ({ many }) => ({
  users: many(users),
  campaigns: many(campaigns),
  socialMetrics: many(socialMetrics),
  contentBuckets: many(brandContentBuckets),
  monitoringSources: many(brandMonitoringSources),
  scrapedItems: many(brandScrapedItems),
}));

export const brandContentBucketsRelations = relations(brandContentBuckets, ({ one }) => ({
  brand: one(brands, {
    fields: [brandContentBuckets.brandId],
    references: [brands.id],
  }),
}));

export const brandMonitoringSourcesRelations = relations(brandMonitoringSources, ({ one, many }) => ({
  brand: one(brands, {
    fields: [brandMonitoringSources.brandId],
    references: [brands.id],
  }),
  scrapedItems: many(brandScrapedItems),
}));

export const campaignsRelations = relations(campaigns, ({ one, many }) => ({
  brand: one(brands, {
    fields: [campaigns.brandId],
    references: [brands.id],
  }),
  deliverables: many(deliverables),
  campaignMetrics: many(campaignMetrics),
}));

export const deliverablesRelations = relations(deliverables, ({ one, many }) => ({
  campaign: one(campaigns, {
    fields: [deliverables.campaignId],
    references: [campaigns.id],
  }),
  files: many(deliverableFiles),
  comments: many(comments),
  contentVersions: many(contentVersions),
  revisions: many(revisions),
}));

export const deliverableFilesRelations = relations(deliverableFiles, ({ one }) => ({
  deliverable: one(deliverables, {
    fields: [deliverableFiles.deliverableId],
    references: [deliverables.id],
  }),
}));

export const commentsRelations = relations(comments, ({ one }) => ({
  deliverable: one(deliverables, {
    fields: [comments.deliverableId],
    references: [deliverables.id],
  }),
  user: one(users, {
    fields: [comments.userId],
    references: [users.id],
  }),
}));

export const contentVersionsRelations = relations(contentVersions, ({ one, many }) => ({
  deliverable: one(deliverables, {
    fields: [contentVersions.deliverableId],
    references: [deliverables.id],
  }),
  files: many(contentVersionFiles),
}));

export const revisionsRelations = relations(revisions, ({ one, many }) => ({
  deliverable: one(deliverables, {
    fields: [revisions.deliverableId],
    references: [deliverables.id],
  }),
  files: many(revisionFiles),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
}));

export const brandScrapedItemsRelations = relations(brandScrapedItems, ({ one }) => ({
  brand: one(brands, {
    fields: [brandScrapedItems.brandId],
    references: [brands.id],
  }),
  source: one(brandMonitoringSources, {
    fields: [brandScrapedItems.sourceId],
    references: [brandMonitoringSources.id],
  }),
}));
