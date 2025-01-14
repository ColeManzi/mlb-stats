import React, { useState, useEffect } from 'react';
import './DailyDigest.css';

function DailyDigest() {
    const [videos, setVideos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [favorites, setFavoriteNames] = useState([]);
    const accessToken = localStorage.getItem('accessToken'); // Get accessToken from local storage
    const isLoggedIn = !!accessToken; // Check for accessToken

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
                const headers = {
                    Authorization: `Bearer ${accessToken}`,
                };
                const [teamIdsResponse, playerIdsResponse] = await Promise.allSettled([
                    fetch("http://localhost:5000/api/users/fetch-teams", { headers }),
                    fetch("http://localhost:5000/api/users/fetch-players", { headers }),
                ]);

                const teamIds = teamIdsResponse.status === 'fulfilled' ? await teamIdsResponse.value.json() : [];
                const playerIds = playerIdsResponse.status === 'fulfilled' ?  await playerIdsResponse.value.json() : [];
                if (teamIds.length === 0 && playerIds.length === 0 ) {
                    setLoading(false)
                    return; 
                }
                if (teamIds.length === 0 && playerIds.length === 0 ) {
                    return;
                }

                console.log("made it here");

                const teamNamePromises = teamIds && teamIds.length > 0 ? teamIds.map(async (teamId) => {
                    const teamResponse = await fetch(`https://statsapi.mlb.com/api/v1/teams/${teamId}`);
                    if (!teamResponse.ok) {
                        console.log(`failed to fetch team name for id ${teamId}`);
                        throw new Error(`Failed to fetch team name for id ${teamId}`);
                    }
                    const teamData = await teamResponse.json();
                    console.log(teamData);
                    return teamData.teams.name;
                }) : [];
                
                const playerNamePromises = playerIds && playerIds.length > 0 ? playerIds.map(async (playerId) => {
                    const playerResponse = await fetch(`https://statsapi.mlb.com/api/v1/people/${playerId}`);
                    if (!playerResponse.ok) {
                        console.log(`failed to fetch player name for id ${playerId}`);
                        throw new Error(`Failed to fetch player name for id ${playerId}`);
                    }
                    const playerData = await playerResponse.json();
                    return playerData.people.fullName
                }) : [];

                const allNames = await Promise.all([...teamNamePromises, ...playerNamePromises]);
                setFavoriteNames(allNames);
                if (allNames && allNames.length > 0){
                    const response = await fetch(`http://localhost:5000/api/users/fetch-youtube-videos`, {
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
                    setVideos(fetchedVideos);
                }

          } catch (err) {
            setError(err.message)
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