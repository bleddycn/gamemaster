import { z } from "zod";
export declare const Id: z.ZodString;
export declare const UserRoleEnum: z.ZodEnum<["SITE_ADMIN", "CLUB_ADMIN", "PLAYER"]>;
export type UserRole = z.infer<typeof UserRoleEnum>;
export declare const CompetitionStatusEnum: z.ZodEnum<["DRAFT", "OPEN", "RUNNING", "FINISHED"]>;
export type CompetitionStatus = z.infer<typeof CompetitionStatusEnum>;
export declare const CreateCompetitionSchema: z.ZodObject<{
    clubId: z.ZodString;
    name: z.ZodString;
    sport: z.ZodString;
    entryFeeCents: z.ZodNumber;
    currency: z.ZodDefault<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    clubId: string;
    name: string;
    sport: string;
    entryFeeCents: number;
    currency: string;
}, {
    clubId: string;
    name: string;
    sport: string;
    entryFeeCents: number;
    currency?: string | undefined;
}>;
export declare const CreateClubSchema: z.ZodObject<{
    name: z.ZodString;
    slug: z.ZodString;
    brandingJson: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    name: string;
    slug: string;
    brandingJson?: string | undefined;
}, {
    name: string;
    slug: string;
    brandingJson?: string | undefined;
}>;
export type CreateClubInput = z.infer<typeof CreateClubSchema>;
export declare const TemplateStatusEnum: z.ZodEnum<["DRAFT", "PUBLISHED", "ARCHIVED"]>;
export type TemplateStatus = z.infer<typeof TemplateStatusEnum>;
export declare const CreateGameTemplateSchema: z.ZodObject<{
    name: z.ZodString;
    gameType: z.ZodString;
    sport: z.ZodString;
    status: z.ZodDefault<z.ZodEnum<["DRAFT", "PUBLISHED", "ARCHIVED"]>>;
    activationOpenAt: z.ZodOptional<z.ZodString>;
    activationCloseAt: z.ZodOptional<z.ZodString>;
    joinOpenAt: z.ZodOptional<z.ZodString>;
    joinCloseAt: z.ZodOptional<z.ZodString>;
    startAt: z.ZodString;
    rulesJson: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
    name: string;
    sport: string;
    gameType: string;
    startAt: string;
    activationOpenAt?: string | undefined;
    activationCloseAt?: string | undefined;
    joinOpenAt?: string | undefined;
    joinCloseAt?: string | undefined;
    rulesJson?: string | undefined;
}, {
    name: string;
    sport: string;
    gameType: string;
    startAt: string;
    status?: "DRAFT" | "PUBLISHED" | "ARCHIVED" | undefined;
    activationOpenAt?: string | undefined;
    activationCloseAt?: string | undefined;
    joinOpenAt?: string | undefined;
    joinCloseAt?: string | undefined;
    rulesJson?: string | undefined;
}>;
export type CreateGameTemplateInput = z.infer<typeof CreateGameTemplateSchema>;
export declare const ActivateTemplateSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    entryFeeCents: z.ZodNumber;
    currency: z.ZodDefault<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    entryFeeCents: number;
    currency: string;
    name?: string | undefined;
}, {
    entryFeeCents: number;
    name?: string | undefined;
    currency?: string | undefined;
}>;
export type ActivateTemplateInput = z.infer<typeof ActivateTemplateSchema>;
export declare const JoinCompetitionSchema: z.ZodObject<{
    email: z.ZodString;
    name: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    email: string;
    name?: string | undefined;
}, {
    email: string;
    name?: string | undefined;
}>;
export type JoinCompetitionInput = z.infer<typeof JoinCompetitionSchema>;
