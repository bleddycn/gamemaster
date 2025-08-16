"use client";

import { useState } from "react";

type Fixture = {
  id: string;
  homeTeam: string;
  awayTeam: string;
  resultHome: number | null;
  resultAway: number | null;
  kickoffAt: string | null;
  status: string;
};

type Props = {
  apiBase: string;
  roundId: string;
  fixtures: Fixture[];
};

export default function FixturePicker({ apiBase, roundId, fixtures }: Props) {
  const [picks, setPicks] = useState<Record<string, string>>({});
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  function handlePickChange(fixtureId: string, teamPicked: string) {
    setPicks(prev => ({ ...prev, [fixtureId]: teamPicked }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    if (!email) {
      setError("Please enter your email address");
      return;
    }

    if (Object.keys(picks).length === 0) {
      setError("Please select at least one team");
      return;
    }

    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const pickPromises = Object.entries(picks).map(([fixtureId, teamPicked]) =>
        fetch(`${apiBase}/picks`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, fixtureId, teamPicked }),
        })
      );

      const responses = await Promise.all(pickPromises);
      
      // Check if all picks were successful
      const failed = responses.filter(r => !r.ok);
      if (failed.length > 0) {
        const errorText = await failed[0].text();
        throw new Error(`Failed to submit some picks: ${errorText}`);
      }

      setSuccess(`Successfully submitted ${Object.keys(picks).length} pick(s)!`);
      setPicks({});
    } catch (err: any) {
      setError(err?.message || "Failed to submit picks");
    } finally {
      setSubmitting(false);
    }
  }

  if (fixtures.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No fixtures available for picking in this round.
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Email Input */}
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
          Your Email (for picks identification)
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="your@email.com"
        />
      </div>

      {/* Fixtures */}
      <div className="space-y-4">
        <h3 className="font-medium">Select your picks:</h3>
        
        {fixtures.map(fixture => (
          <div key={fixture.id} className="border rounded-lg p-4 bg-white">
            <div className="flex items-center justify-between mb-3">
              <div className="font-medium">
                {fixture.homeTeam} vs {fixture.awayTeam}
              </div>
              {fixture.kickoffAt && (
                <div className="text-sm text-gray-500">
                  {new Date(fixture.kickoffAt).toLocaleString()}
                </div>
              )}
            </div>
            
            <div className="flex gap-3">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  name={`fixture-${fixture.id}`}
                  value={fixture.homeTeam}
                  checked={picks[fixture.id] === fixture.homeTeam}
                  onChange={() => handlePickChange(fixture.id, fixture.homeTeam)}
                  className="text-blue-600"
                />
                <span className="text-sm font-medium">{fixture.homeTeam}</span>
              </label>
              
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  name={`fixture-${fixture.id}`}
                  value={fixture.awayTeam}
                  checked={picks[fixture.id] === fixture.awayTeam}
                  onChange={() => handlePickChange(fixture.id, fixture.awayTeam)}
                  className="text-blue-600"
                />
                <span className="text-sm font-medium">{fixture.awayTeam}</span>
              </label>
            </div>
          </div>
        ))}
      </div>

      {/* Error/Success Messages */}
      {error && (
        <div className="text-sm text-red-600 p-3 bg-red-50 rounded-lg">{error}</div>
      )}
      
      {success && (
        <div className="text-sm text-green-600 p-3 bg-green-50 rounded-lg">{success}</div>
      )}

      {/* Submit Button */}
      <button
        type="submit"
        disabled={submitting || Object.keys(picks).length === 0 || !email}
        className="w-full rounded-lg bg-blue-600 text-white py-3 font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
      >
        {submitting ? "Submitting Picks..." : `Submit ${Object.keys(picks).length} Pick(s)`}
      </button>
    </form>
  );
}