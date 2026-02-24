import { z } from "zod";

const campaignType = z.enum(["LinkedIn", "Instagram", "YouTube", "TikTok"]);

export const createCampaignSchema = z.object({
  name: z.string().min(1).max(255),
  type: campaignType,
  brandId: z.string().uuid(),
});

export const updateCampaignSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  type: campaignType.optional(),
  brandId: z.string().uuid().optional(),
});

export type CreateCampaignInput = z.infer<typeof createCampaignSchema>;
export type UpdateCampaignInput = z.infer<typeof updateCampaignSchema>;
