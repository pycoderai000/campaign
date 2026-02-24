import { z } from "zod";

const postType = z.enum(["Static", "Carousel", "Video post"]);
const status = z.enum(["New content", "In revision", "Approved", "Live", "Cancelled"]);

export const createDeliverableSchema = z.object({
  name: z.string().min(1).max(255),
  postType,
  caption: z.string(),
  postingDate: z.string().min(1).max(10),
  postingTime: z.string().min(1).max(10),
  liveLink: z.string().url().optional().or(z.literal("")),
  campaignId: z.string().uuid(),
  fileUrls: z.array(z.string().url()).default([]),
  status: status.default("New content"),
});

export const createDeliverablesBulkSchema = z.array(createDeliverableSchema);

export const updateDeliverableSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  postType: postType.optional(),
  caption: z.string().optional(),
  postingDate: z.string().min(1).max(10).optional(),
  postingTime: z.string().min(1).max(10).optional(),
  liveLink: z.string().url().optional().or(z.literal("")).nullable(),
  status: status.optional(),
  fileUrls: z.array(z.string().url()).optional(),
  revisionNote: z.string().optional(),
  newFileUrls: z.array(z.string().url()).optional(),
});

export type CreateDeliverableInput = z.infer<typeof createDeliverableSchema>;
export type UpdateDeliverableInput = z.infer<typeof updateDeliverableSchema>;
