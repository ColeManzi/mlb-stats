import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './PlayerInfo.css';
import StarIcon from '@mui/icons-material/Star';
import StarBorderIcon from '@mui/icons-material/StarBorder';

const PlayerInfo = () => {
    const { playerId: playerIdParam, playerName } = useParams();
    const playerId = parseInt(playerIdParam, 10);
    const navigate = useNavigate();
    const [imageUrl, setImageUrl] = useState('');
    const [playerStats, setPlayerStats] = useState(null);
    const [error, setError] = useState(null);
    const [newsData, setNewsData] = useState([]);
    const [loading, setLoading] = useState(false);
    const backendUrl = 'http://localhost:5000/api/users/bigquery/player-news';
    const cachedDataRef = useRef({});
    const [playerBackground, setPlayerBackground] = useState(null);
    const [statsLoading, setStatsLoading] = useState(false);
    const [statsError, setStatsError] = useState(null);
    const [starredPlayers, setStarredPlayers] = useState({});
    const [message, setMessage] = useState(null);

    useEffect(() => {
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


        if (playerId){
            const player_current_headshot_url = `https://securea.mlb.com/mlb/images/players/head_shot/${playerId}.jpg`;
            setImageUrl(player_current_headshot_url);
            fetchPlayerStats();
            fetchPlayerNews();
            fetchPlayerBackground();
            fetchInitialStarredPlayers();
        }
    }, [playerId]);



    const fetchPlayerNews = async () => {
         if (!playerId) return;

         setLoading(true);
         setError(null);

         // Check ref cache first
         if (cachedDataRef.current[playerId]) {
            setNewsData(cachedDataRef.current[playerId]);
            setLoading(false);
            return;
        }

         const storedData = sessionStorage.getItem(`playerNews_${playerId}`);

         if (storedData) {
                setNewsData(JSON.parse(storedData));
                cachedDataRef.current[playerId] = JSON.parse(storedData) // Store in ref
                setLoading(false);
                return;
          }

         try {
                const response = await fetch(`${backendUrl}/${playerId}`);
                if (!response.ok) {
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }
                const data = await response.json();
                setNewsData(data.data || []);
    
                sessionStorage.setItem(`playerNews_${playerId}`, JSON.stringify(data.data));
                 cachedDataRef.current[playerId] = data.data;
          } catch (err) {
                console.error("Failed to fetch news:", err);
                setError(err.message || 'Failed to fetch news.');
                 setNewsData([]);
           } finally {
                 setLoading(false);
         }
    };

    const fetchPlayerBackground = async () => {
        setStatsLoading(true);
        setStatsError(null);
        setPlayerBackground(null);
    
        try {
          const statsUrl = `https://statsapi.mlb.com/api/v1/people/${playerId}`;
          const response = await fetch(statsUrl);
          if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP error! status: ${response.status}, text: ${errorText.substring(0, 100)}`);
          }
          const json = await response.json();
    
          if (json.people && json.people.length > 0) {
            setPlayerBackground(json.people[0]);
          } else {
            setStatsError(new Error("No player data found for this ID."));
          }
        } catch (error) {
          setStatsError(error);
        } finally {
          setStatsLoading(false);
        }
      };

    const fetchPlayerStats = async () => {
        try{
            const response = await axios.get(`https://statsapi.mlb.com/api/v1/people/${playerId}/stats?stats=career`);
            const careerStats = response.data.stats.find(stat => stat.type.displayName === "career");
             if(careerStats && careerStats.splits && careerStats.splits.length > 0){
                setPlayerStats(careerStats.splits[0].stat);

             }else{
                setError("No career stats found for this player.");
                setPlayerStats(null);
             }
        } catch(error){
            console.error("Error fetching player stats:", error);
            setError("Failed to load player stats.");
            setPlayerStats(null);
        }
    }


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
                console.log("Player ID added successfully");
                    // After successfully adding the player to the backend, update sessionStorage
                try{
                    const playerResponse = await axios.get(`https://statsapi.mlb.com/api/v1/people/${playerId}`);
                    const playerName = playerResponse.data.people[0].fullName;
                    
                    const favoritesJSON = sessionStorage.getItem('favorites');
                    let favoritesArray = [];

                    if (favoritesJSON) {
                    favoritesArray = JSON.parse(favoritesJSON);
                    }

                    // Add name if it doesn't exist
                if(!favoritesArray.includes(playerName)){
                    favoritesArray.push(playerName);
                    sessionStorage.setItem('favorites', JSON.stringify(favoritesArray));
                    console.log("Player added successfully to favorites in session storage", playerName);
                    } else {
                        console.log('Player already exists in favorites', playerName);
                    }

                } catch(error){
                    console.error('Error adding name to favorites', error)
                }


            } else {
                console.log("There was an issue adding the Player ID")
            }
        } catch (error) {
            console.error("There was an error adding the player id:", error)
        }
    };
    
    const handleRemovePlayerId = async (playerId) => {
        try {
            const accessToken = localStorage.getItem('accessToken');
            const response = await axios.delete('http://localhost:5000/api/users', {
                headers: {
                    Authorization: `Bearer ${accessToken}`
                },
                data: {
                    playerId: playerId
                }
            });
    
            if (response.status === 200) {
                console.log("Player ID removed successfully");
    
                // After successfully removing the player from the backend, update sessionStorage
                try {
                    const playerResponse = await axios.get(`https://statsapi.mlb.com/api/v1/people/${playerId}`);
                    const playerName = playerResponse.data.people[0].fullName;

                    const favoritesJSON = sessionStorage.getItem('favorites');
                    if (favoritesJSON) {
                        const favoritesArray = JSON.parse(favoritesJSON);
                            const updatedFavorites = favoritesArray.filter(name => name !== playerName);
                        sessionStorage.setItem('favorites', JSON.stringify(updatedFavorites));
                        console.log(`Removed ${playerName} from favorites. Updated favorites:`, updatedFavorites);

                    } else {
                        console.log("No favorites found in session storage")
                    }
               
                } catch (error) {
                        console.error('Error removing player from favorites in session storage:', error);
                }
            } else {
                console.log("There was an issue removing the Player ID");
            }
        } catch (error) {
            console.error("There was an error removing the player id:", error);
        }
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

    return (
        <div className="background">
            {message && (
                <div className="message-popup">
                     {message}
                </div>
            )}
             <div className="background-team-title">
                <h3> {`${playerName}`}
                    <span
                        onClick={() => handleStarClick(playerId)}
                        style={{ cursor: 'pointer', marginLeft: '5px' }}
                    >
                        {starredPlayers[playerId] ? <StarIcon /> : <StarBorderIcon />}
                    </span>
                </h3>
            </div>
            <div className="background-player-info-and-headshot-container">
                <div className="background-player-headshot">
                    <img
                        className="player-headshot"
                        src={imageUrl}
                        alt="Player Headshot"
                    />
                </div>
                <div className="background-player-info">
                    {statsLoading && <p>Loading stats...</p>}
                    {statsError && <p className='error'>Error loading stats: {statsError.message}</p>}
                    {playerBackground && (
                        <div className="player-stats-grid">
                            <div className="player-stat">
                                <strong>Position:</strong> {playerBackground.primaryPosition.name}
                            </div>
                            <div className="player-stat">
                                <strong>Throws:</strong> {playerBackground.pitchHand?.description || 'N/A'}
                            </div>
                            <div className="player-stat">
                                <strong>Bats:</strong> {playerBackground.batSide?.description || 'N/A'}
                            </div>
                            <div className="player-stat">
                                <strong>Born:</strong> {playerBackground.birthDate} ({playerBackground.birthCity}, {playerBackground.birthCountry})
                            </div>
                            <div className="player-stat">
                                <strong>Height/Weight:</strong> {playerBackground.height} / {playerBackground.weight} lbs
                            </div>
                            <div className="player-stat">
                                <strong>MLB Debut:</strong> {playerBackground.mlbDebutDate}
                            </div>
                            <div className="player-stat">
                                <strong>Number:</strong> {playerBackground.primaryNumber}
                            </div>
                            {playerBackground.draftYear && (
                                <div className="player-stat">
                                    <strong>Draft Year:</strong> {playerBackground.draftYear}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
            <div className="background-player-container">
                <div className="background-player-info">
                    <p>Player Info Here</p>
                </div>
            </div>
            <div className='stat-preview-container'>
                <h3 className='stat-preview-container-title'>Career Stats</h3>
                <div className='stat-preview-container-contents'>
                    {error ? (
                        <p>{error}</p>
                    ) : playerStats ? (
                        <>
                            <p><strong>Games Played:</strong> {playerStats.gamesPlayed}</p>
                            <p><strong>Runs:</strong> {playerStats.runs}</p>
                            <p><strong>Hits:</strong> {playerStats.hits}</p>
                            <p><strong>Home Runs:</strong> {playerStats.homeRuns}</p>
                            <p><strong>RBI:</strong> {playerStats.rbi}</p>
                            <p><strong>Batting Average:</strong> {playerStats.avg}</p>
                            <p><strong>On-Base Percentage:</strong> {playerStats.obp}</p>
                            <p><strong>Slugging Percentage:</strong> {playerStats.slg}</p>
                            <p><strong>OPS:</strong> {playerStats.ops}</p>
                            <p><strong>Stolen Bases:</strong> {playerStats.stolenBases}</p>
                        </>
                    ) : (
                        <p>Loading stats...</p>
                    )}
                </div>
            </div>
            <div className='background-player-news'>
                <h3 className='sub-title'>Trending Player News</h3>
                {loading && <p>Loading News...</p>}
                {error && <p>{error}</p>}
                {newsData && newsData.length > 0 ? (
                    <ul className="newsList">
                        {newsData.map((newsItem, index) => {
                            const { title, description, link } = newsItem;

                            return (
                                <li key={index} className="newsItem">
                                    <div className="newsLink">
                                        <a
                                            href={link}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="newsLink"
                                        >
                                            <h3 className="newsHeadline">{title}</h3>
                                        </a>
                                    </div>
                                    {description && <p className="newsDescription">{description}</p>}
                                </li>
                            );
                        })}
                    </ul>
                ) : (
                    !loading && !error && <p>No news found</p>
                )}
            </div>
        </div>
    );
};

export default PlayerInfo;