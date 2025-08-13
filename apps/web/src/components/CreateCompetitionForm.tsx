"use client";

import { useState, useTransition } from "react";

type Props = {
  apiBase: string;
  clubId: string;
  onCreated?: () => void; // callback to refresh the page
};

export default function CreateCompetitionForm({ apiBase, clubId, onCreated }: Props) {
  const [name, setName] = useState("");
  const [sport, setSport] = useState("EPL");
  const [entryFeeCents, setEntryFeeCents] = useState(1000);
  const [currency, setCurrency] = useState("EUR");
  const [submitting, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    try {
      const res = await fetch(`${apiBase}/clubs/${clubId}/competitions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, sport, entryFeeCents, currency })
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error || "Failed to create competition");
        return;
      }
      // reset and trigger refresh
      setName("");
      startTransition(() => {
        onCreated?.();
      });
    } catch (err: any) {
      setError(err?.message || "Network error");
    }
  }

  return (
    <form onSubmit={submit} className="rounded-xl border p-4 bg-white space-y-3">
      <h3 className="font-semibold">Create competition</h3>
      <div className="grid gap-2 sm:grid-cols-2">
        <label className="flex flex-col text-sm">
          <span className="mb-1">Name</span>
          <input
            className="border rounded p-2"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Competition 1"
            required
          />
        </label>
        <label className="flex flex-col text-sm">
          <span className="mb-1">Sport</span>
          <input
            className="border rounded p-2"
            value={sport}
            onChange={(e) => setSport(e.target.value)}
            placeholder="EPL"
            required
          />
        </label>
        <label className="flex flex-col text-sm">
          <span className="mb-1">Entry fee (cents)</span>
          <input
            type="number"
            className="border rounded p-2"
            value={entryFeeCents}
            min={0}
            onChange={(e) => setEntryFeeCents(parseInt(e.target.value || "0", 10))}
            required
          />
        </label>
        <label className="flex flex-col text-sm">
          <span className="mb-1">Currency</span>
          <input
            className="border rounded p-2"
            value={currency}
            onChange={(e) => setCurrency(e.target.value.toUpperCase())}
            placeholder="EUR"
            required
          />
        </label>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        className="rounded-lg bg-black text-white px-4 py-2 disabled:opacity-60"
        disabled={submitting}
      >
        {submitting ? "Creating..." : "Create"}
      </button>
    </form>
  );
}