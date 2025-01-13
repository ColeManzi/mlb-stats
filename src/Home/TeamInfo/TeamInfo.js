import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import StarIcon from '@mui/icons-material/Star';
import StarBorderIcon from '@mui/icons-material/StarBorder';
import './TeamInfo.css';
import TeamSpecificNews from './TeamSpecificNews/TeamSpecificNews';
import Games from './Games/Games'

const TeamInfo = () => {
    const { teamId, teamName } = useParams();
    const [rosterData, setRosterData] = useState(null);
    const [rosterLoading, setRosterLoading] = useState(false);
    const [rosterError, setRosterError] = useState(null);
    const [starredPlayers, setStarredPlayers] = useState({});
    const [teamInfo, setTeamInfo] = useState(null);
    const [teamInfoLoading, setTeamInfoLoading] = useState(false);
    const [teamInfoError, setTeamInfoError] = useState(null);
    const navigate = useNavigate();
    const [message, setMessage] = useState(null); // Message state

    useEffect(() => {
         const fetchTeamRoster = async () => {
            if (!teamId) return;
            setRosterLoading(true);
            setRosterError(null);
            setRosterData(null);
            try {
                const response = await fetch(`https://statsapi.mlb.com/api/v1/teams/${teamId}/roster?season=2024`);
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
        const fetchTeamInfo = async () => {
            if (!teamId) return;
            setTeamInfoLoading(true);
            setTeamInfoError(null);
            setTeamInfo(null);
            try {
                const response = await fetch(`https://statsapi.mlb.com/api/v1/teams/${teamId}`);
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const json = await response.json();
                setTeamInfo(json);
            } catch (error) {
                setTeamInfoError(error);
            } finally {
                setTeamInfoLoading(false);
            }
        };

       const fetchInitialStarredPlayers = async () => {
          const accessToken = localStorage.getItem('accessToken');
          if (accessToken) {
              try {
                  const response = await axios.get('http://localhost:5000/api/users/fetch-players', {
                      headers: {
                          Authorization: `Bearer ${accessToken}`
                      }
                  });
                  if (response.status === 200 && response.data && response.data.playerIds) {
                    const initialStarred = response.data.playerIds.reduce((acc, playerId) => {
                         acc[playerId] = true;
                         return acc;
                    }, {});
                    setStarredPlayers(initialStarred);
                  } else {
                      console.log('Could not get users favorite players')
                  }
              } catch (error) {
                  console.error("There was an error getting the users favorite players:", error);
              }
          }
        };
        fetchTeamRoster();
        fetchTeamInfo();
        fetchInitialStarredPlayers();
    }, [teamId]);

    const handlePlayerClick = (playerId, playerName) => {
        navigate(`${playerId}/${playerName}`);  
    };

  const handleStarClick = (playerId) => {
      const accessToken = localStorage.getItem('accessToken');
        if(!accessToken) {
           setMessage("You must be logged in to favorite players!");
            setTimeout(() => setMessage(null), 3000); // Clear message after 3 seconds
        }
        else {
              setStarredPlayers((prevState) => {
                const isCurrentlyStarred = !!prevState[playerId];
                if (isCurrentlyStarred) {
                    handleRemovePlayerId(playerId);
                    setMessage('Player removed from favorites');
                    setTimeout(() => setMessage(null), 3000);
                  return {
                    ...prevState,
                    [playerId]: false,
                  };
                } else {
                    handleAddPlayerId(playerId);
                    setMessage('Player favorited successfully!');
                    setTimeout(() => setMessage(null), 3000);

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

  if (!teamInfo || !teamInfo.teams || teamInfo.teams.length === 0) {
    return <div>Loading team information...</div>; 
  }

    return (
        <div className="background">
             {message && (
                <div className="message-popup">
                     {message}
                </div>
            )}
            <div className="background-team-title">
                <h3> {`${teamName}`} </h3>
            </div>
            <div className="background-team-container">
                <div className="background-teamlogo">
                    <img
                        src={`/Team-Logos/${teamId}.png`}
                        alt={`${teamName} Logo`}
                        className="team-logo"
                    />
                </div>
                <div className="background-teaminfo">
                    {teamInfoLoading && <p>Loading team info...</p>}
                    {teamInfoError && (
                        <p className="error">Error loading team info: {teamInfoError.message}</p>
                    )}
                     {teamInfo && (
                        <>
                            <p><strong>Location:</strong> {teamInfo.teams[0].locationName}</p>
                            <p><strong>First Year:</strong> {teamInfo.teams[0].firstYearOfPlay}</p>
                            <p><strong>League:</strong> {teamInfo.teams[0].league.name}</p>
                            <p><strong>Division:</strong> {teamInfo.teams[0].division.name}</p>
                            <p><strong>Venue:</strong> {teamInfo.teams[0].venue.name}</p>
                        </>
                    )}
                </div>
            </div>
            {rosterLoading && <p>Loading roster...</p>}
            {rosterError && <p className="error">Error loading roster: {rosterError.message}</p>}

            {rosterData && (
                <ul className="background-container-players">
                    {rosterData.map((player) => (
                        <li
                        key={player.person.id}
                        className="player-item"
                        onClick={() => handlePlayerClick(player.person.id, player.person.fullName)}
                        >
                        <span>
                            {player.person.fullName} - {player.position.name}
                        </span>
                        <span
                            className="star-icon"
                            onClick={(e) => {
                            e.stopPropagation();
                            handleStarClick(player.person.id);
                            }}
                        >
                            {starredPlayers[player.person.id] ? (
                            <StarIcon className="star-icon" />
                            ) : (
                            <StarBorderIcon className="star-icon" />
                            )}
                        </span>
                        </li>
                    ))}
                </ul>
            )}
        <div className="background-recent-games">
            <h3 className="sub-title"> Previous Games</h3>
            <Games firstYearOfPlay={teamInfo.teams[0].firstYearOfPlay}/>
        </div>
        <div className="background-team-news">
            <h3 className="sub-title"> Team News</h3>
            <TeamSpecificNews/>
        </div>
        </div>
    );
};

export default TeamInfo;