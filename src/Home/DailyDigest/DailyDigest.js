import React, { useState, useEffect } from 'react';
import './DailyDigest.css';

function DailyDigest() {
    const [videos, setVideos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [favorites, setFavoriteNames] = useState([]);
    const accessToken = localStorage.getItem('accessToken'); 
    const isLoggedIn = !!accessToken; 

    useEffect(() => {
        async function fetchAndSetFavoritesAndVideos() {
            if (!isLoggedIn) {
                setLoading(false);
                return;
            }
    
            setLoading(true);
            setError(null);
            let allNames = []; 
    
            try {
                const headers = { Authorization: `Bearer ${accessToken}` };
                const [teamIdsResponse, playerIdsResponse] = await Promise.allSettled([
                    fetch("http://localhost:5000/api/users/fetch-teams", { headers }),
                    fetch("http://localhost:5000/api/users/fetch-players", { headers }),
                ]);
    
                let teamIds = [];
                let playerIds = [];
    
                // Handle team IDs response
                if (teamIdsResponse.status === 'fulfilled') {
                    const teamIdsData = await teamIdsResponse.value.json();
                    teamIds = teamIdsData.teamIds; // Extract the playerIds array
                    console.log('Fetched teamIds:', teamIds); // Log the result
                    if (!Array.isArray(teamIds)) {
                        console.error('teamIds is not an array:', teamIds);
                        teamIds = [];
                    }
                } else {
                    console.error('Failed to fetch team IDs', teamIdsResponse.reason);
                }
    
                // Handle player IDs response
                if (playerIdsResponse.status === 'fulfilled') {
                    const playerIdsData = await playerIdsResponse.value.json();
                    playerIds = playerIdsData.playerIds; 
                    console.log('Fetched playerIds:', playerIds); 
                    if (!Array.isArray(playerIds)) {
                        console.error('playerIds is not an array:', playerIds);
                        playerIds = [];
                    }
                } else {
                    console.error('Failed to fetch player IDs', playerIdsResponse.reason);
                }
    
                if (teamIds.length === 0 && playerIds.length === 0) {
                    setLoading(false);
                    return;
                }
    
                // Fetch team names
                const teamNamePromises = teamIds.map(async (teamId) => {
                    const teamResponse = await fetch(`https://statsapi.mlb.com/api/v1/teams/${teamId}`);
                    if (!teamResponse.ok) {
                        console.log(`Failed to fetch team name for id ${teamId}`);
                        throw new Error(`Failed to fetch team name for id ${teamId}`);
                    }
                    const teamData = await teamResponse.json();
                    return teamData.teams[0].name;
                });
    
                // Fetch player names
                const playerNamePromises = playerIds.map(async (playerId) => {
                    const playerResponse = await fetch(`https://statsapi.mlb.com/api/v1/people/${playerId}`);
                    if (!playerResponse.ok) {
                        console.log(`Failed to fetch player name for id ${playerId}`);
                        throw new Error(`Failed to fetch player name for id ${playerId}`);
                    }
                    const playerData = await playerResponse.json();
                    return playerData.people[0].fullName;
                });
    
                allNames = await Promise.all([...teamNamePromises, ...playerNamePromises]);
    
                if (allNames.length > 0) {
                    setFavoriteNames(allNames);
                }
    
                if (allNames.length > 0) {
                    const response = await fetch(`htttp://localhost:5000/api/users/fetch-youtube-videos`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ playerNames: allNames }),
                    });
    
                    if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status}`);
                    }
    
                    const fetchedVideos = await response.json();
                    if (fetchedVideos && fetchedVideos.length > 0) {
                        setVideos(fetchedVideos);
                    }
                }
    
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        }
    
        fetchAndSetFavoritesAndVideos();
    }, [isLoggedIn]);
    
    
    


    function renderVideos() {
        if (loading) {
            return <p>Loading videos...</p>;
        }
        if (error) {
            return <p>Error: {error}</p>;
        }

        if (!isLoggedIn) {
            return <p>Log in and favorite teams/players to get daily digests.</p>;
        }
        if (videos.length === 0 && favorites.length > 0) {
            console.log(favorites);
            return <p>No videos found for your favorite teams or players.</p>;
        }
        if (favorites.length === 0) {
            return <p>No teams or players have been selected.</p>
        }

        return (
            <ul>
                {videos.map(video => (
                    <li key={video.videoId} className="video-list-item">
                        <a href={`https://www.youtube.com/watch?v=${video.videoId}`} target="_blank" rel="noopener noreferrer">
                            <img src={video.thumbnail} alt={video.title} className="video-thumbnail" />
                        </a>
                        <div className="video-details">
                            <h3>{video.playerName} - {video.title}</h3>
                            <p>{video.description}</p>
                        </div>
                    </li>
                ))}
            </ul>
        );
    }

    return (
        <div className="daily-digest">
            {renderVideos()}
        </div>
    );
}

export default DailyDigest;