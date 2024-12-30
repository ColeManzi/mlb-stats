import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import CloseIcon from '@mui/icons-material/Close';
import StarIcon from '@mui/icons-material/Star';
import StarBorderIcon from '@mui/icons-material/StarBorder';
import './TeamInfo.css'

const TeamInfo = () => {
    const { teamId, teamName } = useParams();
    const [rosterData, setRosterData] = useState(null);
    const [rosterLoading, setRosterLoading] = useState(false);
    const [rosterError, setRosterError] = useState(null);
    const [starredPlayers, setStarredPlayers] = useState({});
    const navigate = useNavigate();

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
        fetchTeamRoster();
    }, [teamId]);


    const handlePlayerClick = (player) => {
        console.log('Player clicked:', player);
    };

    const clearRoster = () => {
        navigate('/teams');
        window.location.reload();
    };

    const handleStarClick = (playerId) => {
        const accessToken = localStorage.getItem('accessToken');
        if(!accessToken) {
            // Do nothing
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

    return (
        <div className="background">
            <div className="background-teaminfo">
                <p>{teamName}</p>
            </div>
            {rosterLoading && <p>Loading roster...</p>}
            {rosterError && <p className="error">Error loading roster: {rosterError.message}</p>}

            {rosterData && (
                <ul className="background-container-players">
                {rosterData.map((player) => (
                    <li
                    key={player.person.id}
                    className="player-item"
                    onClick={() => handlePlayerClick(player)}
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
        </div>
    );
};

export default TeamInfo;