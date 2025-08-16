async function getAllCompetitions() {
  const base = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
  
  try {
    // Get all clubs first
    const clubsRes = await fetch(`${base}/clubs`, { cache: "no-store" });
    const clubsData = await clubsRes.json();
    
    const allCompetitions = [];
    
    // Get competitions for each club
    for (const club of clubsData.items) {
      const compsRes = await fetch(`${base}/clubs/${club.id}/competitions`, { cache: "no-store" });
      if (compsRes.ok) {
        const compsData = await compsRes.json();
        allCompetitions.push({
          club,
          competitions: compsData.items
        });
      }
    }
    
    return allCompetitions;
  } catch (error) {
    console.error('Error fetching competitions:', error);
    return [];
  }
}

export default async function DebugCompetitionsPage() {
  const competitionsByClub = await getAllCompetitions();

  return (
    <main className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Debug: All Competitions</h1>
        
        {competitionsByClub.length === 0 ? (
          <div className="bg-white rounded-lg p-6 text-center">
            <p className="text-gray-500">No competitions found.</p>
            <a href="/clubs" className="text-blue-600 hover:underline mt-2 inline-block">
              Go to clubs to create some competitions
            </a>
          </div>
        ) : (
          <div className="space-y-6">
            {competitionsByClub.map(({ club, competitions }) => (
              <div key={club.id} className="bg-white rounded-lg p-6">
                <h2 className="text-xl font-semibold mb-4">{club.name} ({club.slug})</h2>
                
                {competitions.length === 0 ? (
                  <p className="text-gray-500">No competitions for this club.</p>
                ) : (
                  <div className="space-y-3">
                    {competitions.map((comp: any) => (
                      <div key={comp.id} className="border rounded-lg p-4 bg-gray-50">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-medium">{comp.name}</h3>
                            <p className="text-sm text-gray-600">
                              ID: <code className="bg-gray-200 px-1 rounded">{comp.id}</code>
                            </p>
                            <p className="text-sm text-gray-600">
                              Status: <span className={`font-medium ${
                                comp.status === 'OPEN' ? 'text-green-600' :
                                comp.status === 'DRAFT' ? 'text-amber-600' :
                                comp.status === 'RUNNING' ? 'text-blue-600' : 'text-gray-600'
                              }`}>{comp.status}</span>
                            </p>
                            <p className="text-sm text-gray-600">
                              {comp.sport} • {comp.currency} {(comp.entryFeeCents/100).toFixed(2)}
                            </p>
                          </div>
                          <div className="text-right">
                            <a 
                              href={`/competitions/${comp.id}`}
                              className="inline-block rounded bg-blue-600 text-white px-3 py-1 text-sm hover:bg-blue-700"
                            >
                              View Details
                            </a>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
        
        <div className="mt-8 text-center">
          <a href="/clubs" className="text-blue-600 hover:underline">
            ← Back to Clubs
          </a>
        </div>
      </div>
    </main>
  );
}