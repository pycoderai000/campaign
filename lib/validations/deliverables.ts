import { z } from "zod";

const postType = z.enum(["Static", "Carousel", "Video post"]);
const status = z.enum(["New content", "In revision", "Approved", "Live", "Cancelled"]);

export const createDeliverableSchema = z.object({
  name: z.string().min(1).max(255),
  postType,
  contentBucket: z.string().max(255).optional().or(z.literal("")),
  caption: z.string(),
  postingDate: z.string().min(1).max(10),
  postingTime: z.string().min(1).max(10),
  liveLink: z.string().url().optional().or(z.literal("")),
  campaignId: z.string().uuid(),
  fileUrls: z.array(z.string().min(1)).default([]),
  status: status.default("New content"),
});

export const createDeliverablesBulkSchema = z.array(createDeliverableSchema);

export const updateDeliverableSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  postType: postType.optional(),
  contentBucket: z.string().max(255).optional().or(z.literal("")),
  caption: z.string().optional(),
  postingDate: z.string().min(1).max(10).optional(),
  postingTime: z.string().min(1).max(10).optional(),
  liveLink: z.string().url().optional().or(z.literal("")).nullable(),
  status: status.optional(),
  fileUrls: z.array(z.string().min(1)).optional(),
  revisionNote: z.string().optional(),
  /** Brand revision uploads (optional; revision can be text-only) */
  newFileUrls: z.array(z.string().min(1)).optional(),
});

export type CreateDeliverableInput = z.infer<typeof createDeliverableSchema>;
export type UpdateDeliverableInput = z.infer<typeof updateDeliverableSchema>;
