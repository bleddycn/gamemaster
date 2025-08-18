import type { UserRole, CompetitionStatus } from "./schemas";
export interface Club {
    id: string;
    name: string;
    slug: string;
}
export interface Competition {
    id: string;
    clubId: string;
    name: string;
    sport: string;
    status: CompetitionStatus;
    entryFeeCents: number;
    currency: string;
}
export type { UserRole };
