import React, { useState, useEffect } from 'react';
import './Home.css';
import mlbLogo from '../assets/mlb_logo.png';
import StarBorderIcon from '@mui/icons-material/StarBorder';
import StarIcon from '@mui/icons-material/Star';
import PersonIcon from '@mui/icons-material/Person';
//import { useNavigate } from "react-router-dom";
//import { Modal, TextField, Button, Box } from '@mui/material';
import axios from 'axios';
import Login from '../Login/Login';
import { useNavigate } from 'react-router-dom';
import BigQueryDataDisplay from './BigQueryDataDisplay/BigQueryDataDisplay';
import GameStats from './GameStats/GameStats'
import CloseIcon from '@mui/icons-material/Close'; // Import Close icon
import RelevantNews from './RelevantNews/RelevantNews';



function Home() {
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

    const [dropdownVisible, setDropdownVisible] = useState(true); // State to control dropdown visibility

    const [playerSummary, setPlayerSummary] = useState(null);
    const [summaryLoading, setSummaryLoading] = useState(false);
    const [summaryError, setSummaryError] = useState(null);

    const [starredPlayers, setStarredPlayers] = useState({});

    const navigate = useNavigate();

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
      setDropdownVisible(false); // Hide the dropdown after selecting a team
  };

  const handlePlayerClick = async (player) => {
      setSelectedPlayer(player);
      setDropdownVisible(false); // Hide the dropdown after selecting a player
      setRosterData(false);
      //await fetchPlayerStats(player.person.id);
      //await fetchPlayerSummary(player.person.fullName); // Call Gemini API
  };

  const handleInputChange = (e) => {
      setTeamName(e.target.value);
      setDropdownVisible(true); // Show the dropdown when input changes
  };

  const handleStarClick = (playerId) => {
    const accessToken = localStorage.getItem('accessToken');
    if(!accessToken) {
      setLoginOpen(true)
    } else {
      setStarredPlayers((prevState) => {
        const isCurrentlyStarred = !!prevState[playerId];
        if (isCurrentlyStarred) {
          handleRemovePlayerId(playerId);
          return {
            ...prevState,
            [playerId]: false,
          };
        } else {
          handleAddPlayerId(playerId);
          return {
            ...prevState,
            [playerId]: true,
          };
        }
      });
    }
  };

  const handleAddPlayerId = async (playerId) => {
    try {
      const accessToken = localStorage.getItem('accessToken')
      const response = await axios.put('http://localhost:5000/api/users', {
           playerId: playerId
         }, {
            headers: {
              Authorization: `Bearer ${accessToken}`
          }
         });
      if (response.status === 200) {
        console.log("Player ID added successfully")
      } else {
        console.log("There was an issue adding the Player ID")
      }
      } catch (error) {
        console.error("There was an error adding the player id:", error)
    }
  }

  const handleRemovePlayerId = async (playerId) => {
    try {
      const accessToken = localStorage.getItem('accessToken')
      const response = await axios.delete('http://localhost:5000/api/users', {
            headers: {
              Authorization: `Bearer ${accessToken}`
            },
        data: {
            playerId: playerId
        }
      });
      if (response.status === 200) {
        console.log("Player ID removed successfully")
      } else {
        console.log("There was an issue removing the Player ID")
      }
      } catch (error) {
        console.error("There was an error removing the player id:", error)
      }
  }

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

  const { GoogleGenerativeAI } = require("@google/generative-ai"); // Import the GoogleGenerativeAI class
  const fetchPlayerSummary = async (playerName) => {
      const apiKey = process.env.REACT_APP_API_KEY; // Replace with your actual API key
      const genAI = new GoogleGenerativeAI(apiKey);// Initialize the GoogleGenerativeAI client with the API key
      const model = genAI.getGenerativeModel({ model: "gemini-pro" });
      const prompt = `Tell me a little about the baseball player ${playerName}. Include their latest performance. 2-3 sentences max.`;
      try {
          const result = await model.generateContent(prompt);
          const playerSummary = result.response.text(); // Assuming this is how the result is structured
          setPlayerSummary(playerSummary);// Handle the summary text, e.g., setting the state or doing other operations
      } catch (error) {
          setSummaryError(error); // Set error state if something goes wrong
          console.error("Error fetching player summary:", error);
      } finally {
          setSummaryLoading(false); // Stop loading indicator or similar
      }
  };

  const noPlayers = !rosterData || rosterData.length === 0;
  const clearRoster = () => {
    setRosterData(null);
  }

  const [openLogin, setLoginOpen] = useState(false);
  const handleIconClick = () => {
    const accessToken = localStorage.getItem('accessToken');
      if (accessToken) {
          // If a token exists, the user is considered logged in.
          // Redirect to the /account page
          navigate('/account');
      } else {
          // If no token exists, the user is not logged in
          // Open the login modal.
          setLoginOpen(true);
      }
  };
  const handleLoginClose = () => {
    setLoginOpen(false); // Close the modal
  };
  
  return (
    <div className="App">
      <div className="App-search">
        <img src={mlbLogo} className="App-logo" alt="MLB Logo" />
        <header>
          <PersonIcon 
                  style={{
                    marginRight: '10px', 
                    cursor: 'pointer', 
                    color: 'black',            
                    position: 'absolute',      
                    top: '20px',               
                    right: '20px',
                    fontSize: `40px`             
                  }} 
                  onClick={handleIconClick}
              />
            <Login open={openLogin} handleClose={handleLoginClose} />
          <h1 className='title'>MLB Fan Hub</h1>
          <input
            type="text"
            placeholder="Enter MLB Team Name"
            value={teamName}
            onChange={handleInputChange}
            className='search-bar'
          />
          {dropdownVisible && teams.length > 0 && (
            <ul>
              {teams.map((team) => (
                <li key={team.id} onClick={() => handleTeamClick(team)}>
                  {team.name}
                </li>
              ))}
            </ul>
          )}
          {selectedPlayer && (
            <div className="player-info">
              {statsLoading && <p>Loading stats...</p>}
              {statsError && <p className='error'>Error loading stats: {statsError.message}</p>}
              {playerStats && (
                <div className="player-stats">
                  <h3>{playerStats.fullName}</h3>
                  <p><strong>Position:</strong> {playerStats.primaryPosition.name}</p>
                  <p><strong>Throws:</strong> {playerStats.pitchHand.description}</p>
                  <p><strong>Bats:</strong> {playerStats.batSide.description}</p>
                  <p><strong>Born:</strong> {playerStats.birthDate} ({playerStats.birthCity}, {playerStats.birthCountry})</p>
                  <p><strong>Height/Weight:</strong> {playerStats.height} / {playerStats.weight} lbs</p>
                  <p><strong>MLB Debut:</strong> {playerStats.mlbDebutDate}</p>
                  <p><strong>Number:</strong> {playerStats.primaryNumber}</p>
                </div>
              )}

              {summaryLoading && <p>Loading summary...</p>}
              {summaryError && <p className='error'>Error loading summary: {summaryError.message}</p>}
              {playerSummary && (
                <div className="player-summary">
                  <h3>Player Summary</h3>
                  <p>{playerSummary}</p>
                </div>
              )}
            </div>
          )}
        </header>
      </div>
      <div className="App-feed">
        {/* Conditional rendering based on rosterData presence */}
        {noPlayers ? (
          <GameStats />
        ) : (
          <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <h2>Player Roster</h2>
              <button onClick={clearRoster} style={{background: 'none', border: 'none', cursor: 'pointer'}} aria-label='Close Roster'>
                  <CloseIcon />
              </button>
            </div>
            {rosterLoading && <p>Loading roster...</p>}
            {rosterError && <p className='error'>Error loading roster: {rosterError.message}</p>}
            {rosterData && (
              <ul>
                {rosterData.map((player) => (
                  <li
                    key={player.person.id}
                    onClick={() => handlePlayerClick(player)}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '8px 0',
                    }}
                  >
                    <span style={{ marginLeft: `10px` }}>
                      {player.person.fullName} - {player.position.name}
                    </span>
                    <span onClick={(e) => {
                        e.stopPropagation(); // Prevent triggering player click when star is clicked
                        handleStarClick(player.person.id); // Toggle star
                      }}>
                      {starredPlayers[player.person.id] ? (
                        <StarIcon style={{ marginRight: '10px', cursor: 'pointer' }} />
                      ) : (
                        <StarBorderIcon style={{ marginRight: '10px', cursor: 'pointer' }} />
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </div>
      <div className="Card-container-left-top">
        <h1 className='sub-title'>Player News</h1>
        <BigQueryDataDisplay/>
      </div>
      <div className="Card-container-left-bottom">
        <h1 className='sub-title'>Trending</h1>
        <RelevantNews/>
      </div>
      <div className="Card-container-right">
        <h1 className='sub-title'>Your Interest</h1>
        
      </div>
    </div>
  );
}

export default Home;