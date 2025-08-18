"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";

type Props = {
  apiBase: string;
  competitionId: string;
  onOpened?: () => void;
};

export default function OpenCompetitionButton({ apiBase, competitionId, onOpened }: Props) {
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleOpen = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${apiBase}/competitions/${competitionId}/open`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (!res.ok) {
        if (res.status === 401) {
          setError("You must be signed in to perform this action.");
        } else if (res.status === 403) {
          setError("You don't have permission to perform this action.");
        } else {
          const data = await res.json().catch(() => ({}));
          const apiError = data?.error || "";
          
          // Handle specific time window violations
          if (apiError.includes("You can't open entries yet")) {
            setError("You can't open entries yet.");
          } else if (apiError.includes("Join window has closed")) {
            setError("Join window has closed.");
          } else if (apiError.includes("Only DRAFT competitions can be opened")) {
            setError("This competition has already been opened.");
          } else {
            setError(apiError || `Open failed: ${res.status}`);
          }
        }
        return;
      }

      onOpened?.();
    } catch (err: any) {
      setError(err?.message || "Network error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-2">
      <button
        onClick={handleOpen}
        disabled={loading}
        className="rounded-lg bg-emerald-600 text-white px-3 py-2 text-sm hover:bg-emerald-700 disabled:opacity-50"
      >
        {loading ? "Opening..." : "Open for entries"}
      </button>
      {error && (
        <div className="text-xs text-red-600 bg-red-50 p-2 rounded border">
          {error}
        </div>
      )}
    </div>
  );
}