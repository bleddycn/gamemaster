import JoinCompetitionInline from "@/components/JoinCompetitionInline";
import ActivateTemplateForClub from "@/components/ActivateTemplateForClub";
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
                <div className="flex items-center justify-between">
                  <div>
                    <a href={`/competitions/${c.id}`} className="font-medium text-blue-600 hover:text-blue-800 hover:underline">
                      {c.name}
                    </a>
                    <div className="text-sm text-gray-600">
                      {c.sport} · {c.status} · {c.currency} {(c.entryFeeCents/100).toFixed(2)}
                    </div>
                    <div className="mt-1">
                      <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                        c.status?.toUpperCase() === "OPEN"
                          ? "bg-emerald-100 text-emerald-700"
                          : c.status?.toUpperCase() === "DRAFT"
                          ? "bg-amber-100 text-amber-700"
                          : c.status?.toUpperCase() === "RUNNING"
                          ? "bg-indigo-100 text-indigo-700"
                          : "bg-gray-100 text-gray-700"
                      }`}>
                        {c.status}
                      </span>
                    </div>
                  </div>

                  {c.status === "DRAFT" && (
                    <form action={async () => {
                      "use server";
                      const base = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
                      const res = await fetch(`${base}/competitions/${c.id}/open`, { method: "POST" });
                      if (!res.ok) {
                        const t = await res.text();
                        console.error("OPEN_ERROR", res.status, t);
                        throw new Error(`Open failed: ${res.status}`);
                      }
                      const { revalidatePath } = await import("next/cache");
                      revalidatePath(`/clubs/${club.slug}`);
                    }}>
                      <button className="rounded-lg bg-emerald-600 text-white px-3 py-2 text-sm hover:bg-emerald-700">
                        Open for entries
                      </button>
                    </form>
                  )}
                </div>

                {(c.status?.toUpperCase() === "OPEN") && (
                  <div className="mt-3 pt-3 border-t">
                    <JoinCompetitionInline
                      apiBase={base}
                      competitionId={c.id}
                      onJoined={refresh}
                    />
                  </div>
                )}

                {/* DEBUG: force render the join form to verify it appears; remove after test */}
                {/* <div className="mt-2">
                  <JoinCompetitionInline
                    apiBase={base}
                    competitionId={c.id}
                    onJoined={refresh}
                  />
                </div> */}
              </li>
            ))}
          </ul>
        </div>

        {/* Replaced direct competition creation with template activation */}
        <ActivateTemplateForClub
          apiBase={base}
          clubId={club.id}
          onActivated={refresh}
        />
      </section>
    </main>
  );
}