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