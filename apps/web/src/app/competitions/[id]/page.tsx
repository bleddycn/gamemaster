import { Card, CardHeader } from "@/components/ui/Card";
import FixturePicker from "@/components/FixturePicker";

type Competition = {
  id: string;
  name: string;
  sport: string;
  status: string;
  entryFeeCents: number;
  currency: string;
  startRoundAt: string | null;
  club: { name: string; slug: string };
  template: { gameType: string; rulesJson: string | null } | null;
  rounds: Round[];
};

type Round = {
  id: string;
  name: string;
  status: string;
  deadlineAt: string | null;
  fixtures: Fixture[];
};

type Fixture = {
  id: string;
  homeTeam: string;
  awayTeam: string;
  resultHome: number | null;
  resultAway: number | null;
  kickoffAt: string | null;
  status: string;
};

async function getCompetition(id: string): Promise<Competition> {
  const base = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
  
  try {
    const res = await fetch(`${base}/competitions/${id}`, { cache: "no-store" });
    
    if (!res.ok) {
      console.error(`Failed to fetch competition ${id}: ${res.status} ${res.statusText}`);
      const errorText = await res.text();
      console.error('Error response:', errorText);
      
      if (res.status === 404) {
        throw new Error("Competition not found");
      }
      throw new Error(`Failed to load competition: ${res.status}`);
    }
    
    return await res.json();
  } catch (error) {
    console.error('Error fetching competition:', error);
    throw error;
  }
}

function formatDate(dateString: string | null) {
  if (!dateString) return "—";
  return new Date(dateString).toLocaleString();
}

function formatCurrency(cents: number, currency: string) {
  return `${currency} ${(cents / 100).toFixed(2)}`;
}

export default async function CompetitionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let competition: Competition;
  
  try {
    competition = await getCompetition(id);
  } catch (error) {
    // Return error page
    return (
      <main className="min-h-screen p-8 bg-gradient-to-b from-red-50 via-white to-rose-50">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardHeader title="Competition Not Found" subtitle="The competition you're looking for doesn't exist or has been removed." />
            <div className="text-center py-8">
              <p className="text-gray-600 mb-4">Competition ID: {id}</p>
              <a 
                href="/clubs"
                className="inline-block rounded-lg bg-blue-600 text-white px-6 py-2 font-medium hover:bg-blue-700 transition"
              >
                Back to Clubs
              </a>
            </div>
          </Card>
        </div>
      </main>
    );
  }

  const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

  // Find current round (first UPCOMING round)
  const currentRound = competition.rounds.find(r => r.status === "UPCOMING");
  const canMakePicks = competition.status === "OPEN" && currentRound;

  return (
    <main className="min-h-screen p-8 bg-gradient-to-b from-blue-50 via-white to-indigo-50">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Competition Header */}
        <Card>
          <CardHeader 
            title={competition.name} 
            subtitle={`${competition.club.name} • ${competition.template?.gameType || competition.sport}`}
          />
          
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <div>
              <div className="flex justify-between">
                <span className="text-gray-600">Status:</span>
                <span className={`font-medium ${
                  competition.status === "OPEN" ? "text-green-600" :
                  competition.status === "DRAFT" ? "text-amber-600" :
                  competition.status === "RUNNING" ? "text-blue-600" : "text-gray-600"
                }`}>
                  {competition.status}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Entry Fee:</span>
                <span className="font-medium">{formatCurrency(competition.entryFeeCents, competition.currency)}</span>
              </div>
            </div>
            <div>
              <div className="flex justify-between">
                <span className="text-gray-600">Sport:</span>
                <span className="font-medium">{competition.sport}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Start:</span>
                <span className="font-medium">{formatDate(competition.startRoundAt)}</span>
              </div>
            </div>
          </div>
        </Card>

        {/* Current Round Picking */}
        {canMakePicks && currentRound && (
          <Card>
            <CardHeader 
              title={`${currentRound.name} - Make Your Picks`}
              subtitle={`Deadline: ${formatDate(currentRound.deadlineAt)}`}
            />
            
            <FixturePicker
              apiBase={apiBase}
              roundId={currentRound.id}
              fixtures={currentRound.fixtures}
            />
          </Card>
        )}

        {/* Rounds & Fixtures */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold">Rounds & Fixtures</h2>
          
          {competition.rounds.length === 0 ? (
            <Card>
              <p className="text-gray-500 text-center py-8">No rounds or fixtures available yet.</p>
            </Card>
          ) : (
            competition.rounds.map(round => (
              <Card key={round.id}>
                <CardHeader 
                  title={round.name}
                  subtitle={`Status: ${round.status} • Deadline: ${formatDate(round.deadlineAt)}`}
                />
                
                {round.fixtures.length === 0 ? (
                  <p className="text-gray-500 text-sm">No fixtures in this round.</p>
                ) : (
                  <div className="space-y-2">
                    {round.fixtures.map(fixture => (
                      <div key={fixture.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-4">
                          <div className="text-sm font-medium">
                            {fixture.homeTeam} vs {fixture.awayTeam}
                          </div>
                          {fixture.kickoffAt && (
                            <div className="text-xs text-gray-500">
                              {formatDate(fixture.kickoffAt)}
                            </div>
                          )}
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          {fixture.resultHome !== null && fixture.resultAway !== null ? (
                            <div className="text-sm font-medium">
                              {fixture.resultHome} - {fixture.resultAway}
                            </div>
                          ) : (
                            <div className="text-xs text-gray-500">
                              {fixture.status}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            ))
          )}
        </div>
      </div>
    </main>
  );
}