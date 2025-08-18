"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import JoinCompetitionInline from "@/components/JoinCompetitionInline";
import ActivateTemplateForClub from "@/components/ActivateTemplateForClub";
import OpenCompetitionButton from "@/components/OpenCompetitionButton";
import Layout from "@/components/Layout";
import { Card, CardHeader } from "@/components/ui/Card";
import { Table, TableHeader, TableBody, TableRow, TableCell, TableHeaderCell, ActionButton, StatusBadge } from "@/components/ui/Table";
import Link from "next/link";

function getJoinWindowStatus(openAt: string | null, closeAt: string | null, startAt: string | null): { status: 'open' | 'upcoming' | 'closed', label: string, color: string } {
  const now = new Date();
  const open = openAt ? new Date(openAt) : null;
  const close = closeAt ? new Date(closeAt) : null;
  const start = startAt ? new Date(startAt) : null;
  
  // Use joinCloseAt if available, otherwise fallback to startAt
  const effectiveClose = close || start;
  
  // If we have an open time and we're before it
  if (open && now < open) {
    const hours = Math.ceil((open.getTime() - now.getTime()) / (1000 * 60 * 60));
    if (hours <= 48) {
      return { 
        status: 'upcoming', 
        label: hours === 1 ? 'opens in 1h' : hours <= 24 ? `opens in ${hours}h` : `opens in ${Math.ceil(hours/24)}d`, 
        color: 'bg-amber-100 text-amber-800' 
      };
    }
    return { status: 'upcoming', label: 'not yet open', color: 'bg-gray-100 text-gray-600' };
  }
  
  // If we're past the effective close time
  if (effectiveClose && now > effectiveClose) {
    return { status: 'closed', label: 'closed', color: 'bg-gray-100 text-gray-600' };
  }
  
  // If we're within the join window
  if (effectiveClose) {
    const hours = Math.ceil((effectiveClose.getTime() - now.getTime()) / (1000 * 60 * 60));
    if (hours <= 2) {
      return { 
        status: 'open', 
        label: 'closes soon', 
        color: 'bg-rose-100 text-rose-800' 
      };
    } else if (hours <= 24) {
      return { 
        status: 'open', 
        label: `closes in ${hours}h`, 
        color: 'bg-emerald-100 text-emerald-800' 
      };
    } else {
      const days = Math.ceil(hours / 24);
      return { 
        status: 'open', 
        label: days === 1 ? 'closes in 1d' : `closes in ${days}d`, 
        color: 'bg-emerald-100 text-emerald-800' 
      };
    }
  }
  
  return { status: 'open', label: 'open', color: 'bg-emerald-100 text-emerald-800' };
}

function JoinWindowBadge({ competition }: { competition: Competition }) {
  if (!competition.template || competition.status?.toUpperCase() !== 'OPEN') {
    return null;
  }
  
  const { status, label, color } = getJoinWindowStatus(
    competition.template.joinOpenAt,
    competition.template.joinCloseAt,
    competition.template.startAt
  );
  
  return (
    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${color}`}>
      {label}
    </span>
  );
}

interface Club {
  id: string;
  name: string;
  slug: string;
}

interface Competition {
  id: string;
  name: string;
  sport: string;
  status: string;
  entryFeeCents: number;
  currency: string;
  createdAt: string;
  template?: {
    joinOpenAt: string | null;
    joinCloseAt: string | null;
    startAt: string | null;
  } | null;
}

interface Props {
  club: Club;
  competitions: Competition[];
}

export default function ClubPageClient({ club, competitions: initialCompetitions }: Props) {
  const { user, isSiteAdmin, isClubAdmin } = useAuth();
  const [competitions, setCompetitions] = useState(initialCompetitions);
  const base = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

  // Check if user can administer this club
  const canAdminister = isSiteAdmin() || isClubAdmin(club.id);

  const refreshCompetitions = async () => {
    try {
      const res = await fetch(`${base}/clubs/${club.id}/competitions`, { cache: "no-store" });
      const data = await res.json();
      setCompetitions(data.items || []);
    } catch (error) {
      console.error("Failed to refresh competitions:", error);
    }
  };

  return (
    <Layout 
      title={club.name} 
      subtitle={`Club slug: ${club.slug}`}
    >
      <div className="space-y-6">
        {/* Show banner for signed-in non-admin users */}
        {user && !canAdminister && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <span className="text-amber-600">⚠️</span>
              <p className="text-sm text-amber-700">
                You're signed in, but not an admin of this club. Admin controls are hidden.
              </p>
            </div>
          </div>
        )}

        {/* Competitions */}
        <Card>
          <CardHeader 
            title="Competitions" 
            subtitle={`${competitions.length} competitions in this club`}
          />
          <div className="p-6">
            {competitions.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-4xl text-gray-400 mb-4">🏆</div>
                <h3 className="text-lg font-medium text-gray-700 mb-2">No competitions yet</h3>
                <p className="text-gray-500 mb-4">
                  {canAdminister 
                    ? "Activate a template to create your first competition." 
                    : "Check back soon for new competitions."}
                </p>
                {canAdminister && (
                  <p className="text-sm text-gray-600">
                    Use the "Template Activation" section below to create competitions.
                  </p>
                )}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHeaderCell>Competition</TableHeaderCell>
                    <TableHeaderCell>Sport & Entry Fee</TableHeaderCell>
                    <TableHeaderCell>Status</TableHeaderCell>
                    <TableHeaderCell>Join Window</TableHeaderCell>
                    <TableHeaderCell align="right">Actions</TableHeaderCell>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {competitions.map(competition => (
                    <TableRow key={competition.id}>
                      <TableCell>
                        <div>
                          <Link 
                            href={`/competitions/${competition.id}`}
                            className="font-medium text-blue-600 hover:text-blue-800 hover:underline"
                          >
                            {competition.name}
                          </Link>
                          <div className="text-xs text-gray-500">ID: {competition.id.slice(0, 8)}...</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div className="font-medium">{competition.sport}</div>
                          <div className="text-gray-500">
                            {competition.currency} {(competition.entryFeeCents/100).toFixed(2)}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={competition.status}>
                          {competition.status}
                        </StatusBadge>
                      </TableCell>
                      <TableCell>
                        <JoinWindowBadge competition={competition} />
                      </TableCell>
                      <TableCell align="right">
                        <div className="flex items-center gap-2 justify-end">
                          <Link href={`/competitions/${competition.id}`}>
                            <ActionButton
                              onClick={() => {}}
                              variant="primary"
                              size="sm"
                            >
                              View
                            </ActionButton>
                          </Link>
                          {competition.status === "DRAFT" && canAdminister && (
                            <OpenCompetitionButton
                              apiBase={base}
                              competitionId={competition.id}
                              onOpened={refreshCompetitions}
                            />
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </Card>

        {/* Join Competition Inline (for open competitions) */}
        {competitions.some(c => c.status?.toUpperCase() === "OPEN") && (
          <Card>
            <CardHeader 
              title="Join Competitions" 
              subtitle="Enter open competitions"
            />
            <div className="p-6 space-y-6">
              {competitions
                .filter(c => c.status?.toUpperCase() === "OPEN")
                .map(competition => (
                  <div key={competition.id} className="border rounded-lg p-4">
                    <h3 className="font-medium text-gray-900 mb-2">{competition.name}</h3>
                    <JoinCompetitionInline
                      apiBase={base}
                      competitionId={competition.id}
                      onJoined={refreshCompetitions}
                    />
                  </div>
                ))}
            </div>
          </Card>
        )}

        {/* Template Activation for Admins */}
        {canAdminister ? (
          <Card>
            <CardHeader 
              title="Template Activation" 
              subtitle="Create new competitions from templates"
            />
            <div className="p-6">
              <ActivateTemplateForClub
                apiBase={base}
                clubId={club.id}
                onActivated={refreshCompetitions}
              />
            </div>
          </Card>
        ) : (
          !user && (
            <Card>
              <CardHeader 
                title="Admin Controls" 
                subtitle="Sign in to access admin features"
              />
              <div className="p-6 text-center">
                <div className="text-gray-500 mb-4">
                  <p className="text-sm">Admin controls are only visible to club administrators.</p>
                </div>
                <Link href="/auth/sign-in">
                  <ActionButton
                    onClick={() => {}}
                    variant="primary"
                  >
                    Sign In
                  </ActionButton>
                </Link>
              </div>
            </Card>
          )
        )}
      </div>
    </Layout>
  );
}