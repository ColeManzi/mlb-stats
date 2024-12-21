import React, { useState, useEffect } from 'react';

function App() {
  const [teamName, setTeamName] = useState('');
  const [teams, setTeams] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [rosterData, setRosterData] = useState(null);
  const [rosterLoading, setRosterLoading] = useState(false);
  const [rosterError, setRosterError] = useState(null);

  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [playerStats, setPlayerStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [statsError, setStatsError] = useState(null);

  useEffect(() => {
    const fetchTeams = async () => {
      if (!teamName) {
        setTeams([]);
        return;
      }

      try {
        const response = await fetch('https://statsapi.mlb.com/api/v1/teams?sportId=1');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const json = await response.json();
        const matchingTeams = json.teams.filter(team =>
          team.name.toLowerCase().includes(teamName.toLowerCase()) ||
          team.locationName.toLowerCase().includes(teamName.toLowerCase())
        );
        setTeams(matchingTeams);
      } catch (error) {
        console.error("Error fetching teams:", error);
        //Consider adding error handling here to display an error message to the user.
      }
    };
    fetchTeams();
  }, [teamName]);

  useEffect(() => {
    const fetchTeamRoster = async () => {
      if (!selectedTeam) return;
      setRosterLoading(true);
      setRosterError(null);
      setRosterData(null);

      try {
        const response = await fetch(`https://statsapi.mlb.com/api/v1/teams/${selectedTeam.id}/roster?season=2024`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const json = await response.json();
        setRosterData(json.roster);
      } catch (error) {
        setRosterError(error);
      } finally {
        setRosterLoading(false);
      }
    };
    fetchTeamRoster();
  }, [selectedTeam]);

  const handleTeamClick = (team) => {
    setSelectedTeam(team);
    setTeamName(team.name);
  };

  const handlePlayerClick = (player) => {
    setSelectedPlayer(player);
    fetchPlayerStats(player.person.id);
  };

  const fetchPlayerStats = async (playerId) => {
    setStatsLoading(true);
    setStatsError(null);
    setPlayerStats(null);

    try {
      const statsUrl = `https://statsapi.mlb.com/api/v1/people/${playerId}`;
      const response = await fetch(statsUrl);
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, text: ${errorText.substring(0, 100)}`);
      }
      const json = await response.json();

      if (json.people && json.people.length > 0) {
        setPlayerStats(json.people[0]);
      } else {
        setStatsError(new Error("No player data found for this ID."));
      }
    } catch (error) {
      setStatsError(error);
    } finally {
      setStatsLoading(false);
    }
  };

  return (
    <div className="App" style={{ fontFamily: 'sans-serif', display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', backgroundColor: '#f0f0f0' }}>
      <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)' }}>
        <header style={{ textAlign: 'center' }}>
          <h1 style={{ fontSize: '2em', marginBottom: '10px' }}>MLB Stats</h1>

          <input
            type="text"
            placeholder="Enter MLB Team Name"
            value={teamName}
            onChange={(e) => setTeamName(e.target.value)}
            style={{ marginBottom: '10px', padding: '8px', border: '1px solid #ccc', borderRadius: '4px', width: '300px' }}
          />

          {teams.length > 0 && (
            <ul style={{ listStyle: 'none', padding: 0 }}>
              {teams.map((team) => (
                <li
                  key={team.id}
                  style={{ marginBottom: '5px', padding: '5px', borderBottom: '1px solid #eee', cursor: 'pointer' }}
                  onClick={() => handleTeamClick(team)}
                >
                  {team.name}
                </li>
              ))}
            </ul>
          )}

          {rosterLoading && <p>Loading roster...</p>}
          {rosterError && <p style={{ color: 'red' }}>Error loading roster: {rosterError.message}</p>}
          {rosterData && (
            <ul style={{ listStyle: 'none', padding: 0 }}>
              {rosterData.map((player) => (
                <li
                  key={player.person.id}
                  style={{ marginBottom: '5px', padding: '5px', borderBottom: '1px solid #eee', cursor: 'pointer' }}
                  onClick={() => handlePlayerClick(player)}
                >
                  {player.person.fullName} - {player.position.name}
                </li>
              ))}
            </ul>
          )}

          {selectedPlayer && (
            <div>
              {statsLoading && <p>Loading stats...</p>}
              {statsError && <p style={{ color: 'red' }}>Error loading stats: {statsError.message}</p>}
              {selectedPlayer && (
                <div>
                  <h3>Selected Player Details:</h3>
                  {statsLoading && <p>Loading stats...</p>}
                  {statsError && <p style={{ color: 'red' }}>Error loading stats: {statsError.message}</p>}
                  {playerStats && (
                    <div>
                      <h3>{playerStats.fullName}</h3>
                      <p><strong>Position:</strong> {playerStats.primaryPosition.name}</p>
                      <p><strong>Throws:</strong> {playerStats.pitchHand.description}</p>
                      <p><strong>Bats:</strong> {playerStats.batSide.description}</p>
                      <p><strong>Born:</strong> {playerStats.birthDate} ({playerStats.birthCity}, {playerStats.birthCountry})</p>
                      <p><strong>Height/Weight:</strong> {playerStats.height} / {playerStats.weight} lbs</p>
                      <p><strong>MLB Debut:</strong> {playerStats.mlbDebutDate}</p>
                      <p><strong>Number:</strong> {playerStats.primaryNumber}</p>
                      {/* Add more relevant stats as needed */}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </header>
      </div>
    </div>
  );
}

export default App;