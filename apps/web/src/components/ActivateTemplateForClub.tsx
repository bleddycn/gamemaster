"use client";

import { useState, useEffect } from "react";

type Template = {
  id: string;
  name: string;
  gameType: string;
  sport: string;
  status: string;
  activationOpenAt: string | null;
  activationCloseAt: string | null;
  joinOpenAt: string | null;
  joinCloseAt: string | null;
  startAt: string;
};

type Props = {
  apiBase: string;
  clubId: string;
  onActivated?: () => void;
};

export default function ActivateTemplateForClub({ apiBase, clubId, onActivated }: Props) {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [activating, setActivating] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    fetchTemplates();
  }, []);

  async function fetchTemplates() {
    try {
      const res = await fetch(`${apiBase}/templates?status=PUBLISHED&upcoming=true`);
      const data = await res.json();
      setTemplates(data.items || []);
    } catch (err) {
      setError("Failed to load templates");
    } finally {
      setLoading(false);
    }
  }

  async function activateTemplate(templateId: string) {
    setActivating(templateId);
    setError(null);
    setSuccess(null);
    
    try {
      const res = await fetch(`${apiBase}/clubs/${clubId}/activate-template/${templateId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          entryFeeCents: 500, // Default entry fee of €5.00
          currency: "EUR"
        }),
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        setError(data?.error || "Failed to activate template");
      } else {
        setSuccess("Template activated successfully!");
        onActivated?.();
        // Refresh templates list
        await fetchTemplates();
      }
    } catch (err: any) {
      setError(err?.message || "Network error");
    } finally {
      setActivating(null);
    }
  }

  function formatDate(d: string | null) {
    if (!d) return "—";
    return new Date(d).toLocaleDateString();
  }

  if (loading) {
    return (
      <div className="space-y-3">
        <h2 className="font-semibold">Available Templates</h2>
        <div className="text-sm text-gray-500">Loading templates...</div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h2 className="font-semibold">Available Templates</h2>
      
      {error && (
        <div className="text-sm text-red-600 p-3 bg-red-50 rounded-lg">{error}</div>
      )}
      
      {success && (
        <div className="text-sm text-green-600 p-3 bg-green-50 rounded-lg">{success}</div>
      )}

      {templates.length === 0 ? (
        <div className="text-sm text-gray-500">No templates available at this time.</div>
      ) : (
        <div className="space-y-3">
          {templates.map(template => {
            const now = new Date();
            const activationOpen = template.activationOpenAt ? new Date(template.activationOpenAt) : null;
            const activationClose = template.activationCloseAt ? new Date(template.activationCloseAt) : null;
            
            const canActivate = (!activationOpen || now >= activationOpen) && 
                                (!activationClose || now <= activationClose);
            
            return (
              <div key={template.id} className="rounded-lg border p-4 bg-white">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="font-medium">{template.name}</div>
                    <div className="text-sm text-gray-600 mt-1">
                      {template.gameType} · {template.sport}
                    </div>
                    <div className="text-xs text-gray-500 mt-2 space-y-1">
                      <div>Starts: {formatDate(template.startAt)}</div>
                      <div>Activation window: {formatDate(template.activationOpenAt)} - {formatDate(template.activationCloseAt)}</div>
                      <div>Join window: {formatDate(template.joinOpenAt)} - {formatDate(template.joinCloseAt)}</div>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => activateTemplate(template.id)}
                    disabled={!canActivate || activating === template.id}
                    className={`ml-4 px-4 py-2 rounded-lg text-sm font-medium transition ${
                      canActivate 
                        ? "bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50" 
                        : "bg-gray-200 text-gray-500 cursor-not-allowed"
                    }`}
                  >
                    {activating === template.id ? "Activating..." : 
                     !canActivate ? "Not Available" : "Activate"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}