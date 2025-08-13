import CreateCompetitionForm from "@/components/CreateCompetitionForm";
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

export default async function ClubPage({ params }: { params: { slug: string } }) {
  const { club, comps } = await getClubAndComps(params.slug);
  const base = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

  // Helper for server action-style refresh (simple approach)
  async function refresh() {
    "use server";
    revalidatePath(`/clubs/${club.slug}`);
  }

  return (
    <main className="min-h-screen p-8 bg-slate-50 space-y-6">
      <header>
        <h1 className="text-2xl font-bold">{club.name}</h1>
        <p className="text-gray-500">{club.slug}</p>
      </header>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-3">
          <h2 className="font-semibold">Competitions</h2>
          <ul className="space-y-2">
            {comps.items.length === 0 && (
              <li className="text-sm text-gray-500">No competitions yet.</li>
            )}
            {comps.items.map(c => (
              <li key={c.id} className="rounded-lg border p-4 bg-white">
                <div className="font-medium">{c.name}</div>
                <div className="text-sm text-gray-600">
                  {c.sport} · {c.status} · {c.currency} {(c.entryFeeCents/100).toFixed(2)}
                </div>
              </li>
            ))}
          </ul>
        </div>

        <CreateCompetitionForm
          apiBase={base}
          clubId={club.id}
          onCreated={refresh}
        />
      </section>
    </main>
  );
}