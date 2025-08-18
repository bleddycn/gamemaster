"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";

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
  const { token } = useAuth();
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
        headers: { 
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ 
          entryFeeCents: 500, // Default entry fee of €5.00
          currency: "EUR"
        }),
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        if (res.status === 401) {
          setError("You must be signed in to perform this action.");
        } else if (res.status === 403) {
          setError("You don't have permission to perform this action.");
        } else if (res.status === 400) {
          // Handle specific time window violations with friendly messages
          const apiError = data?.error || "";
          if (apiError.includes("Activation window is closed")) {
            setError("Activation window is closed for this template.");
          } else if (apiError.includes("Template not published")) {
            setError("This template is no longer available for activation.");
          } else {
            setError(apiError || "Unable to activate template at this time.");
          }
        } else {
          setError(data?.error || "Failed to activate template");
        }
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

  function TemplateSkeleton() {
    return (
      <div className="animate-pulse">
        <div className="rounded-lg border p-4 bg-white">
          <div className="flex items-start justify-between">
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              <div className="space-y-1 mt-2">
                <div className="h-2 bg-gray-200 rounded w-2/3"></div>
                <div className="h-2 bg-gray-200 rounded w-4/5"></div>
                <div className="h-2 bg-gray-200 rounded w-3/5"></div>
              </div>
            </div>
            <div className="ml-4 h-9 bg-gray-200 rounded-lg w-20"></div>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-3">
        <h2 className="font-semibold">Available Templates</h2>
        <div className="space-y-3">
          <TemplateSkeleton />
          <TemplateSkeleton />
          <TemplateSkeleton />
        </div>
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
        <div className="text-center py-8 px-6 bg-gradient-to-br from-indigo-50 to-rose-50 rounded-xl border">
          <div className="text-4xl text-gray-400 mb-3">⚡</div>
          <h3 className="text-sm font-medium text-gray-700 mb-1">No templates available</h3>
          <p className="text-xs text-gray-500">Check back later for new game templates to activate.</p>
        </div>
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