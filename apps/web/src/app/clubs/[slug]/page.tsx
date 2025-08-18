import JoinCompetitionInline from "@/components/JoinCompetitionInline";
import ActivateTemplateForClub from "@/components/ActivateTemplateForClub";
import OpenCompetitionButton from "@/components/OpenCompetitionButton";
import ClubPageClient from "./client";
import { revalidatePath } from "next/cache";

async function getClubAndComps(slug: string) {
  const base = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

  const clubRes = await fetch(`${base}/clubs/by-slug/${slug}`, { cache: "no-store" });
  if (!clubRes.ok) {
    throw new Error("Club not found");
  }
  const club = (await clubRes.json()) as { id: string; name: string; slug: string };

  const compsRes = await fetch(`${base}/clubs/${club.id}/competitions`, { cache: "no-store" });
  const comps = (await compsRes.json()) as {
    items: { id: string; name: string; sport: string; status: string; entryFeeCents: number; currency: string; createdAt: string }[];
  };

  return { club, comps };
}

export default async function ClubPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { club, comps } = await getClubAndComps(slug);

  return (
    <ClubPageClient 
      club={club} 
      competitions={comps.items} 
    />
  );
}