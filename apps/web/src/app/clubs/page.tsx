async function getClubs() {
  const base = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
  const res = await fetch(`${base}/clubs`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch clubs");
  return (await res.json()) as { items: { id: string; name: string; slug: string }[] };
}

export default async function ClubsPage() {
  const data = await getClubs();
  return (
    <main className="min-h-screen p-8 bg-slate-50">
      <h1 className="text-2xl font-bold">Clubs</h1>
      <ul className="mt-4 space-y-2">
        {data.items.map(c => (
          <li key={c.id} className="rounded-lg border p-4 bg-white">
            <div className="font-medium">{c.name}</div>
            <div className="text-sm text-gray-500">{c.slug}</div>
          </li>
        ))}
      </ul>
    </main>
  );
}