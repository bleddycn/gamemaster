"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";

type Props = {
  apiBase: string;
  onCreated?: () => void;
};

export default function CreateTemplateForm({ apiBase, onCreated }: Props) {
  const { token } = useAuth();
  const [name, setName] = useState("");
  const [gameType, setGameType] = useState("LMS");
  const [sport, setSport] = useState("EPL");
  const [status, setStatus] = useState("PUBLISHED");
  const [activationOpenAt, setActivationOpenAt] = useState("");
  const [activationCloseAt, setActivationCloseAt] = useState("");
  const [joinOpenAt, setJoinOpenAt] = useState("");
  const [joinCloseAt, setJoinCloseAt] = useState("");
  const [startAt, setStartAt] = useState("");
  const [rulesJson, setRulesJson] = useState('{"noReuseTeam":true}');
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setOk(null);
    try {
      const body: Record<string, any> = {
        name, gameType, sport, status,
        startAt,
      };
      if (activationOpenAt) body.activationOpenAt = activationOpenAt;
      if (activationCloseAt) body.activationCloseAt = activationCloseAt;
      if (joinOpenAt) body.joinOpenAt = joinOpenAt;
      if (joinCloseAt) body.joinCloseAt = joinCloseAt;
      if (rulesJson) body.rulesJson = rulesJson;

      const res = await fetch(`${apiBase}/templates`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 401) {
          setError("You must be signed in to perform this action.");
        } else if (res.status === 403) {
          setError("You don't have permission to perform this action.");
        } else {
          setError(data?.error || "Failed to create template");
        }
      } else {
        setOk("Template created");
        setName("");
        setStartAt("");
        onCreated?.();
      }
    } catch (err: any) {
      setError(err?.message || "Network error");
    } finally {
      setBusy(false);
    }
  }

  const label = "text-xs font-medium text-gray-600";
  const input = "border rounded-lg p-2 focus:outline-none focus:ring w-full";

  return (
    <form onSubmit={submit} className="space-y-3">
      <div className="grid sm:grid-cols-2 gap-3">
        <label className="flex flex-col">
          <span className={label}>Name</span>
          <input className={input} value={name} onChange={e=>setName(e.target.value)} placeholder="LMS – EPL – Week 3" required/>
        </label>
        <label className="flex flex-col">
          <span className={label}>Game type</span>
          <input className={input} value={gameType} onChange={e=>setGameType(e.target.value)} placeholder="LMS" required/>
        </label>
        <label className="flex flex-col">
          <span className={label}>Sport</span>
          <input className={input} value={sport} onChange={e=>setSport(e.target.value)} placeholder="EPL" required/>
        </label>
        <label className="flex flex-col">
          <span className={label}>Status</span>
          <select className={input} value={status} onChange={e=>setStatus(e.target.value)}>
            <option value="DRAFT">DRAFT</option>
            <option value="PUBLISHED">PUBLISHED</option>
            <option value="ARCHIVED">ARCHIVED</option>
          </select>
        </label>
        <label className="flex flex-col">
          <span className={label}>Start at (ISO)</span>
          <input className={input} value={startAt} onChange={e=>setStartAt(e.target.value)} placeholder="2025-08-23T12:30:00.000Z" required/>
        </label>
        <label className="flex flex-col">
          <span className={label}>Rules (JSON)</span>
          <input className={input} value={rulesJson} onChange={e=>setRulesJson(e.target.value)} placeholder='{"noReuseTeam":true}'/>
        </label>
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        <label className="flex flex-col">
          <span className={label}>Activation open (ISO)</span>
          <input className={input} value={activationOpenAt} onChange={e=>setActivationOpenAt(e.target.value)} placeholder="2025-08-01T09:00:00.000Z"/>
        </label>
        <label className="flex flex-col">
          <span className={label}>Activation close (ISO)</span>
          <input className={input} value={activationCloseAt} onChange={e=>setActivationCloseAt(e.target.value)} placeholder="2025-08-20T23:59:59.000Z"/>
        </label>
        <label className="flex flex-col">
          <span className={label}>Join open (ISO)</span>
          <input className={input} value={joinOpenAt} onChange={e=>setJoinOpenAt(e.target.value)} placeholder="2025-08-01T09:00:00.000Z"/>
        </label>
        <label className="flex flex-col">
          <span className={label}>Join close (ISO)</span>
          <input className={input} value={joinCloseAt} onChange={e=>setJoinCloseAt(e.target.value)} placeholder="2025-08-23T11:00:00.000Z"/>
        </label>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {ok && <p className="text-sm text-green-600">{ok}</p>}

      <button type="submit" disabled={busy}
        className="rounded-xl bg-indigo-600 text-white px-4 py-2 hover:bg-indigo-700 transition disabled:opacity-60">
        {busy ? "Creating…" : "Create template"}
      </button>
    </form>
  );
}