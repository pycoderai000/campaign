import { z } from "zod";

export const createBrandSchema = z.object({
  name: z.string().min(1).max(255),
  poc: z.string().min(1).max(255),
  email: z.string().email(),
  contactNumber: z.string().min(1).max(50),
  instagramLink: z.string().url().optional().or(z.literal("")),
  instagramHandle: z.string().max(255).optional(),
  youtubeLink: z.string().url().optional().or(z.literal("")),
  youtubeHandle: z.string().max(255).optional(),
  tiktokLink: z.string().url().optional().or(z.literal("")),
  tiktokHandle: z.string().max(255).optional(),
});

export const updateBrandSchema = createBrandSchema.partial();

export type CreateBrandInput = z.infer<typeof createBrandSchema>;
export type UpdateBrandInput = z.infer<typeof updateBrandSchema>;
