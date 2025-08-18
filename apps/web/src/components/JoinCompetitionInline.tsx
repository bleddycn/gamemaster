"use client";

import { useState } from "react";

type Props = {
  apiBase: string;
  competitionId: string;
  onJoined?: () => void;
};

export default function JoinCompetitionInline({ apiBase, competitionId, onJoined }: Props) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch(`${apiBase}/competitions/${competitionId}/entries`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name: name || undefined }),
      });

      const data = await res.json();

      if (!res.ok) {
        const apiError = data?.error || "";
        
        // Handle specific time window violations
        if (apiError.includes("Join window has closed")) {
          setError("Join window has closed.");
        } else if (apiError.includes("Competition is not open for entries")) {
          setError("This competition is not currently open for new entries.");
        } else if (apiError.includes("already joined")) {
          setError("You've already joined this competition.");
        } else {
          setError(apiError || `Failed to join competition (${res.status})`);
        }
      } else {
        setSuccess("Successfully joined the competition!");
        setEmail("");
        setName("");
        onJoined?.();
      }
    } catch (err: any) {
      setError(err?.message || "Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-gray-900">Join Competition</h3>
      
      {error && (
        <div className="text-sm text-red-600 p-2 bg-red-50 rounded-md">{error}</div>
      )}
      
      {success && (
        <div className="text-sm text-green-600 p-2 bg-green-50 rounded-md">{success}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <label htmlFor={`email-${competitionId}`} className="block text-xs font-medium text-gray-600 mb-1">
              Email *
            </label>
            <input
              id={`email-${competitionId}`}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="your@email.com"
            />
          </div>
          <div>
            <label htmlFor={`name-${competitionId}`} className="block text-xs font-medium text-gray-600 mb-1">
              Name (optional)
            </label>
            <input
              id={`name-${competitionId}`}
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Your name"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading || !email}
          className="w-full sm:w-auto rounded-lg bg-blue-600 text-white px-4 py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          {loading ? "Joining..." : "Join Competition"}
        </button>
      </form>
    </div>
  );
}