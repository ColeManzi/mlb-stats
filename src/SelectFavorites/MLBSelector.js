import React, { useState, useEffect } from 'react';
import './MLBSelector.css';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';


const MLBSelector = () => {
  const [teams, setTeams] = useState([]);
  const [players, setPlayers] = useState([]);
  const [selectedTeams, setSelectedTeams] = useState([]);
  const [selectedPlayers, setSelectedPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
      const fetchTeams = async () => {
          try {
              const response = await fetch('https://statsapi.mlb.com/api/v1/teams?sportId=1');
              if (!response.ok) {
                  throw new Error(`HTTP error! status: ${response.status}`);
              }
              const data = await response.json();
              setTeams(data.teams);
          } catch (error) {
              console.error("Error fetching teams:", error);
              setError("Failed to load teams.");
          } finally {
              setLoading(false);
          }
      };

      fetchTeams();
  }, []);


  useEffect(() => {
      const fetchPlayers = async () => {
          try {
              const response = await fetch('https://statsapi.mlb.com/api/v1/sports/1/players');
              if (!response.ok) {
                  throw new Error(`HTTP error! status: ${response.status}`);
              }
              const data = await response.json();
              setPlayers(data.people);
          } catch (error) {
              console.error("Error fetching players:", error);
              setError("Failed to load players.");
          } finally {
              setLoading(false);
          }
      };

      fetchPlayers();
  }, []);

  const handleTeamSelect = (teamId) => {
    if (selectedTeams.includes(teamId)) {
      setSelectedTeams(selectedTeams.filter((id) => id !== teamId));
    } else {
      setSelectedTeams([...selectedTeams, teamId]);
    }
  };

  const handlePlayerSelect = (playerId) => {
    if (selectedPlayers.includes(playerId)) {
      setSelectedPlayers(selectedPlayers.filter((id) => id !== playerId));
    } else {
      setSelectedPlayers([...selectedPlayers, playerId]);
    }
  };

  const handleSearchChange = (event) => {
    setSearchQuery(event.target.value);
  };

  const handleSubmit = async () => {
    const accessToken = localStorage.getItem('accessToken');
    try {
        const response = await axios.put(
            'http://localhost:5000/api/users/add-favorites',
            { favoriteTeams: selectedTeams, favoritePlayers: selectedPlayers },
            {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            }
        );
      if (response.status === 200) {
        navigate('/');
      } else {
        console.error('Error updating favorites, status:', response.status);
      }
    } catch (error) {
      console.error('Error updating favorites:', error);
    }
  };


  const filteredPlayers = players.filter(player =>
    player.fullName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
      return <div>Error: {error}</div>;
  }

  return (
    <div className="mlb-selector-container">
      <h2>Select Your Favorite MLB Teams</h2>
      <div className="list-container">
        {teams.map((team) => (
          <div key={team.id} className={`list-item ${selectedTeams.includes(team.id) ? 'selected' : ''}`} onClick={() => handleTeamSelect(team.id)}>
              <img 
                src={`/Team-Logos/${team.id}.png`} 
                alt={`${team.name} logo`} 
                className="team-logo-favorites" 
               />
              {team.name}
          </div>
        ))}
      </div>

      <h2>Select Your Favorite MLB Players</h2>
      <input
        type="text"
        placeholder="Search players..."
        value={searchQuery}
        onChange={handleSearchChange}
        className="search-bar-favorites"
      />
        <div className="list-container">
            {filteredPlayers.map((player) => (
              <div key={player.id} className={`list-item ${selectedPlayers.includes(player.id) ? 'selected' : ''}`} onClick={() => handlePlayerSelect(player.id)}>
                 <img 
                    src={`https://securea.mlb.com/mlb/images/players/head_shot/${player.id}.jpg`} 
                    alt={`${player.fullName} headshot`} 
                    className="player-headshot-favorites"
                />
                {player.fullName}
              </div>
            ))}
        </div>

      <button onClick={handleSubmit}>Submit</button>
    </div>
  );
};

export default MLBSelector;