import { z } from "zod";

const monitoringSourceSchema = z
  .object({
    name: z.string().min(1).max(255),
    sourceType: z.enum(["website", "news", "leadership"]),
    sourceUrl: z.string().url().max(1024).optional().or(z.literal("")),
    query: z.string().max(512).optional().or(z.literal("")),
    isActive: z.boolean().optional().default(true),
    sortOrder: z.number().int().min(0).optional(),
  })
  .superRefine((data, ctx) => {
    if ((data.sourceType === "website" || data.sourceType === "leadership") && !(data.sourceUrl ?? "").trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["sourceUrl"],
        message: "Website and leadership sources require a source URL",
      });
    }
  });

const brandContactSchema = z.object({
  name: z.string().min(1).max(255),
  poc: z.string().min(1).max(255),
  email: z.string().email(),
  contactNumber: z.string().min(1).max(50),
  contentBucket: z.string().max(255).optional().or(z.literal("")),
  contentBuckets: z.array(z.string().min(1).max(255)).optional().default([]),
  monitoringEnabled: z.boolean().optional().default(false),
  monitoringTime: z
    .string()
    .regex(/^\d{2}:\d{2}$/)
    .optional()
    .default("09:00"),
  monitoringSources: z.array(monitoringSourceSchema).optional().default([]),
  instagramLink: z.string().url().optional().or(z.literal("")),
  instagramHandle: z.string().max(255).optional(),
  youtubeLink: z.string().url().optional().or(z.literal("")),
  youtubeHandle: z.string().max(255).optional(),
  tiktokLink: z.string().url().optional().or(z.literal("")),
  tiktokHandle: z.string().max(255).optional(),
});

export const createBrandSchema = brandContactSchema
  .extend({
    /** If both set, a brand user is created for the brand portal login. */
    portalLoginEmail: z.string().email().optional().or(z.literal("")),
    portalLoginPassword: z.string().min(6).optional().or(z.literal("")),
  })
  .refine(
    (data) => {
      const e = (data.portalLoginEmail ?? "").trim();
      const p = (data.portalLoginPassword ?? "").trim();
      if (!e && !p) return true;
      return Boolean(e && p);
    },
    { message: "Provide both portal login email and password, or leave both empty", path: ["portalLoginEmail"] }
  );

export const updateBrandSchema = brandContactSchema.partial();

export type CreateBrandInput = z.infer<typeof createBrandSchema>;
export type UpdateBrandInput = z.infer<typeof updateBrandSchema>;
