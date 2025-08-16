import { z } from "zod";

export const Id = z.string().min(1);

export const UserRoleEnum = z.enum(["SITE_ADMIN","CLUB_ADMIN","PLAYER"]);
export type UserRole = z.infer<typeof UserRoleEnum>;

export const CompetitionStatusEnum = z.enum(["DRAFT","OPEN","RUNNING","FINISHED"]);
export type CompetitionStatus = z.infer<typeof CompetitionStatusEnum>;

export const CreateCompetitionSchema = z.object({
  clubId: Id,
  name: z.string().min(2),
  sport: z.string().min(2),
  entryFeeCents: z.number().int().nonnegative(),
  currency: z.string().length(3).default("EUR")
});

export const CreateClubSchema = z.object({
  name: z.string().min(2),
  slug: z.string().regex(/^[a-z0-9-]+$/i, "Use letters, numbers, dashes only"),
  brandingJson: z.string().optional() // text JSON stored in SQL Server
});
export type CreateClubInput = z.infer<typeof CreateClubSchema>;

// ---------- Game Templates ----------
export const TemplateStatusEnum = z.enum(["DRAFT","PUBLISHED","ARCHIVED"]);
export type TemplateStatus = z.infer<typeof TemplateStatusEnum>;

export const CreateGameTemplateSchema = z.object({
  name: z.string().min(3),
  gameType: z.string().min(2),      // e.g. "LMS"
  sport: z.string().min(2),         // e.g. "EPL"
  status: TemplateStatusEnum.default("DRAFT"),
  activationOpenAt: z.string().datetime().optional(),  // ISO strings
  activationCloseAt: z.string().datetime().optional(),
  joinOpenAt: z.string().datetime().optional(),
  joinCloseAt: z.string().datetime().optional(),
  startAt: z.string().datetime(),
  rulesJson: z.string().optional()
});
export type CreateGameTemplateInput = z.infer<typeof CreateGameTemplateSchema>;

// Payload a club provides when activating a template
export const ActivateTemplateSchema = z.object({
  // overrideable display name for the club's competition
  name: z.string().min(3).optional(),
  // club-specific pricing and currency
  entryFeeCents: z.number().int().nonnegative(),
  currency: z.string().length(3).default("EUR")
});
export type ActivateTemplateInput = z.infer<typeof ActivateTemplateSchema>;