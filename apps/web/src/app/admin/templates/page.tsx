import CreateTemplateForm from "@/components/CreateTemplateForm";
import { Card, CardHeader } from "@/components/ui/Card";
import { revalidatePath } from "next/cache";

async function getTemplates() {
  const base = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
  const res = await fetch(`${base}/templates?status=PUBLISHED&upcoming=true`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch templates");
  return (await res.json()) as {
    items: {
      id: string; name: string; gameType: string; sport: string; status: string;
      activationOpenAt: string | null; activationCloseAt: string | null;
      joinOpenAt: string | null; joinCloseAt: string | null; startAt: string;
    }[];
  };
}

function fmt(d: string | null) {
  if (!d) return "—";
  const date = new Date(d);
  return date.toLocaleString();
}

export default async function TemplatesAdminPage() {
  const data = await getTemplates();

  return (
    <main className="min-h-screen p-8 bg-gradient-to-b from-indigo-50 via-white to-rose-50">
      <header className="mb-6">
        <h1 className="text-3xl font-extrabold tracking-tight">Game Templates</h1>
        <p className="text-sm text-gray-600">Platform-level templates clubs can activate.</p>
      </header>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-3">
          <h2 className="font-semibold">Published & Upcoming</h2>
          <ul className="space-y-3">
            {data.items.length === 0 && (
              <li className="text-sm text-gray-500">No templates yet.</li>
            )}
            {data.items.map(t => (
              <li key={t.id}>
                <Card>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold">{t.name}</div>
                      <div className="text-xs text-gray-500">{t.gameType} · {t.sport} · {t.status}</div>
                    </div>
                    <div className="text-right text-xs text-gray-600">
                      <div><span className="font-medium">Start:</span> {fmt(t.startAt)}</div>
                      <div><span className="font-medium">Activate:</span> {fmt(t.activationOpenAt)} → {fmt(t.activationCloseAt)}</div>
                      <div><span className="font-medium">Join:</span> {fmt(t.joinOpenAt)} → {fmt(t.joinCloseAt)}</div>
                    </div>
                  </div>
                </Card>
              </li>
            ))}
          </ul>
        </div>

        <div className="space-y-3">
          <h2 className="font-semibold">Create template</h2>
          <Card>
            <CardHeader title="New Template" subtitle="Create a platform-wide game template" />
            {/* simple server action to refresh */}
            {/* @ts-expect-error Async Server Component */}
            <CreateTemplateForm
              apiBase={process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"}
              onCreated={async () => {
                "use server";
                revalidatePath("/admin/templates");
              }}
            />
          </Card>
        </div>
      </section>
    </main>
  );
}