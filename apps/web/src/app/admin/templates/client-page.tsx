"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import CreateTemplateForm from "@/components/CreateTemplateForm";
import { Card, CardHeader } from "@/components/ui/Card";
import Layout from "@/components/Layout";
import { Table, TableHeader, TableBody, TableRow, TableCell, TableHeaderCell, ActionButton, StatusBadge } from "@/components/ui/Table";

interface Template {
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
}

function fmt(d: string | null) {
  if (!d) return "—";
  const date = new Date(d);
  return date.toLocaleString();
}

function getWindowStatus(openAt: string | null, closeAt: string | null): { status: 'open' | 'upcoming' | 'closed', label: string, color: string } {
  if (!openAt && !closeAt) {
    return { status: 'open', label: 'Always', color: 'bg-emerald-100 text-emerald-800' };
  }
  
  const now = new Date();
  const open = openAt ? new Date(openAt) : null;
  const close = closeAt ? new Date(closeAt) : null;
  
  // If we have an open time and we're before it
  if (open && now < open) {
    const days = Math.ceil((open.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return { 
      status: 'upcoming', 
      label: days === 1 ? 'Opens in 1 day' : `Opens in ${days} days`, 
      color: 'bg-amber-100 text-amber-800' 
    };
  }
  
  // If we have a close time and we're after it
  if (close && now > close) {
    return { status: 'closed', label: 'Closed', color: 'bg-gray-100 text-gray-600' };
  }
  
  // If we're between open and close, or no constraints
  if (close) {
    const hours = Math.ceil((close.getTime() - now.getTime()) / (1000 * 60 * 60));
    if (hours <= 24) {
      return { 
        status: 'open', 
        label: hours === 1 ? 'Closes in 1h' : `Closes in ${hours}h`, 
        color: 'bg-rose-100 text-rose-800' 
      };
    } else {
      const days = Math.ceil(hours / 24);
      return { 
        status: 'open', 
        label: days === 1 ? 'Closes in 1 day' : `Closes in ${days} days`, 
        color: 'bg-emerald-100 text-emerald-800' 
      };
    }
  }
  
  return { status: 'open', label: 'Open', color: 'bg-emerald-100 text-emerald-800' };
}

function WindowBadge({ openAt, closeAt, label }: { openAt: string | null, closeAt: string | null, label: string }) {
  const { status, label: statusLabel, color } = getWindowStatus(openAt, closeAt);
  
  return (
    <div className="flex items-center gap-1 text-xs">
      <span className="font-medium text-gray-600">{label}:</span>
      <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${color}`}>
        {statusLabel}
      </span>
    </div>
  );
}

export default function TemplatesAdminClientPage() {
  const router = useRouter();
  const { user, loading: authLoading, isSiteAdmin, token } = useAuth();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);

  useEffect(() => {
    if (authLoading) return; // Wait for auth to load
    
    if (!user || !isSiteAdmin()) {
      router.push("/auth/sign-in");
      return;
    }

    // Fetch templates
    fetchTemplates();
  }, [user, authLoading, router, isSiteAdmin]);

  async function fetchTemplates() {
    try {
      const base = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
      const res = await fetch(`${base}/templates?status=PUBLISHED&upcoming=true`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error("Failed to fetch templates");
      const data = await res.json();
      setTemplates(data.items || []);
    } catch (error) {
      console.error("Error fetching templates:", error);
    } finally {
      setLoading(false);
    }
  }

  function handleEditTemplate(templateId: string) {
    // TODO: Implement template editing
    console.log('Edit template:', templateId);
  }

  function TemplateSkeleton() {
    return (
      <div className="animate-pulse">
        <div className="bg-white border rounded-xl p-4 space-y-3">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
              <div className="h-3 bg-gray-200 rounded w-20"></div>
            </div>
            <div className="flex gap-3">
              <div className="h-6 bg-gray-200 rounded-full w-20"></div>
              <div className="h-6 bg-gray-200 rounded-full w-16"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <Layout 
        title="Game Templates" 
        subtitle="Platform-level templates that clubs can activate"
      >
        <Card>
          <CardHeader title="Published Templates" subtitle="Loading templates..." />
          <div className="p-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHeaderCell>Template</TableHeaderCell>
                  <TableHeaderCell>Type & Sport</TableHeaderCell>
                  <TableHeaderCell>Status</TableHeaderCell>
                  <TableHeaderCell>Activation Window</TableHeaderCell>
                  <TableHeaderCell>Join Window</TableHeaderCell>
                  <TableHeaderCell>Start Date</TableHeaderCell>
                  <TableHeaderCell align="right">Actions</TableHeaderCell>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[1, 2, 3].map(i => (
                  <TableRow key={i}>
                    <TableCell>
                      <div className="animate-pulse">
                        <div className="h-4 bg-gray-200 rounded w-32 mb-1"></div>
                        <div className="h-3 bg-gray-200 rounded w-20"></div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="animate-pulse">
                        <div className="h-4 bg-gray-200 rounded w-16 mb-1"></div>
                        <div className="h-3 bg-gray-200 rounded w-12"></div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="animate-pulse">
                        <div className="h-6 bg-gray-200 rounded-full w-20"></div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="animate-pulse">
                        <div className="h-6 bg-gray-200 rounded-full w-16"></div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="animate-pulse">
                        <div className="h-6 bg-gray-200 rounded-full w-16"></div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="animate-pulse">
                        <div className="h-4 bg-gray-200 rounded w-24"></div>
                      </div>
                    </TableCell>
                    <TableCell align="right">
                      <div className="animate-pulse">
                        <div className="h-8 bg-gray-200 rounded w-16"></div>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      </Layout>
    );
  }

  const actions = (
    <ActionButton 
      onClick={() => setShowCreateForm(true)} 
      variant="primary"
      size="md"
    >
      + Create Template
    </ActionButton>
  );

  return (
    <Layout 
      title="Game Templates" 
      subtitle="Platform-level templates that clubs can activate"
      actions={actions}
    >
      <div className="space-y-6">
        {/* Templates Table */}
        <Card>
          <CardHeader title="Published Templates" subtitle="Available templates for club activation" />
          <div className="p-6">
            {templates.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-4xl text-gray-400 mb-4">📋</div>
                <h3 className="text-lg font-medium text-gray-700 mb-2">No templates yet</h3>
                <p className="text-gray-500 mb-4">Create your first game template to get started.</p>
                <ActionButton 
                  onClick={() => setShowCreateForm(true)} 
                  variant="primary"
                >
                  Create First Template
                </ActionButton>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHeaderCell>Template</TableHeaderCell>
                    <TableHeaderCell>Type & Sport</TableHeaderCell>
                    <TableHeaderCell>Status</TableHeaderCell>
                    <TableHeaderCell>Activation Window</TableHeaderCell>
                    <TableHeaderCell>Join Window</TableHeaderCell>
                    <TableHeaderCell>Start Date</TableHeaderCell>
                    <TableHeaderCell align="right">Actions</TableHeaderCell>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {templates.map(template => (
                    <TableRow key={template.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium text-gray-900">{template.name}</div>
                          <div className="text-xs text-gray-500">ID: {template.id.slice(0, 8)}...</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div className="font-medium">{template.gameType}</div>
                          <div className="text-gray-500">{template.sport}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={template.status}>
                          {template.status}
                        </StatusBadge>
                      </TableCell>
                      <TableCell>
                        <WindowBadge 
                          openAt={template.activationOpenAt} 
                          closeAt={template.activationCloseAt} 
                          label="" 
                        />
                      </TableCell>
                      <TableCell>
                        <WindowBadge 
                          openAt={template.joinOpenAt} 
                          closeAt={template.joinCloseAt} 
                          label="" 
                        />
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-gray-600">
                          {fmt(template.startAt)}
                        </div>
                      </TableCell>
                      <TableCell align="right">
                        <ActionButton
                          onClick={() => handleEditTemplate(template.id)}
                          variant="secondary"
                          size="sm"
                        >
                          Edit
                        </ActionButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </Card>

        {/* Create Template Modal/Form */}
        {showCreateForm && (
          <Card>
            <CardHeader 
              title="Create New Template" 
              subtitle="Define a new game template for clubs to activate" 
            />
            <div className="p-6">
              <CreateTemplateForm
                apiBase={process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"}
                onCreated={() => {
                  fetchTemplates();
                  setShowCreateForm(false);
                }}
              />
              <div className="mt-4">
                <ActionButton
                  onClick={() => setShowCreateForm(false)}
                  variant="secondary"
                >
                  Cancel
                </ActionButton>
              </div>
            </div>
          </Card>
        )}
      </div>
    </Layout>
  );
}