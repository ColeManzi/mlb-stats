import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { CircularProgress, Alert } from '@mui/material';
import './BigQueryDataDisplay.css'; // Import the CSS file

function BigQueryDataDisplay() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [playerNames, setPlayerNames] = useState({});
    const cacheKey = 'mostFollowedPlayersData'; // Define the cache key

    useEffect(() => {
        const fetchMostFollowedPlayers = async () => {
            setLoading(true);
            setError('');

            // Check if cached data exists in sessionStorage
            const cachedData = sessionStorage.getItem(cacheKey);
            if(cachedData) {
              try {
                const parsedCache = JSON.parse(cachedData);
                 setData(parsedCache);
                fetchPlayerNames(parsedCache);
                setLoading(false);
                return;
              } catch (e) {
                // Cached data is invalid, continue with API call.
                sessionStorage.removeItem(cacheKey);
                  console.log("Cached data is invalid, fetching new data")
              }

            }
          

            try {
                const response = await axios.get('http://localhost:5000/api/users/bigquery/followed-players');
                if (response.status === 200) {
                    setData(response.data.data);
                     // Store the response data in sessionStorage
                    sessionStorage.setItem(cacheKey, JSON.stringify(response.data.data));
                    fetchPlayerNames(response.data.data);
                } else {
                    setError('Failed to fetch BigQuery data.');
                }
            } catch (err) {
                console.error('Error fetching BigQuery data:', err);
                if(err.response && err.response.data && err.response.data.error){
                    setError(err.response.data.error);
                }else{
                    setError('Failed to fetch bigquery data. Please try again later.')
                }
            } finally {
                setLoading(false);
            }
        };
        fetchMostFollowedPlayers();
    }, []);

     const fetchPlayerNames = async (players) => {
        try {
            const namePromises = players.map(async (player) => {
                const playerId = player.player_id;
                try {
                    const response = await axios.get(`https://statsapi.mlb.com/api/v1/people/${playerId}`);
                    if(response.data && response.data.people && response.data.people[0])
                    {
                      const playerName = response.data.people[0].fullName;
                       return { [playerId]: playerName };
                    }else{
                       console.log(`Failed to get name of player ${playerId}`);
                       return { [playerId] : "Name Not Found"}
                    }
                } catch (err) {
                   console.error(`Error fetching player name for ${playerId}`, err);
                    return { [playerId]: "Name Not Found"};
                }
            });

            const nameResults = await Promise.all(namePromises);

            const namesObject = nameResults.reduce((acc, curr) => ({...acc, ...curr}), {});
            setPlayerNames(namesObject);

        } catch (err) {
            console.error('Error during player name fetching', err)
            setError('Error during player name fetching');
        }
    }


    if (loading) {
        return <CircularProgress />;
    }

    if (error) {
        return <Alert severity="error">{error}</Alert>;
    }

    if (!data) {
        return <p>No data available.</p>;
    }

    const transformContentType = (contentType) => {
        if (contentType === "article") {
            return "news";
        } else if (contentType === "video") {
            return "video";
        }
        return contentType
    }

    return (
        <ul className="newsList">
            {data.map((row) => (
                <li key={row.player_id} className="newsItem">
                    <div className="newsLink">
                        <a
                            href={`https://www.mlb.com/${transformContentType(row.content_type)}/${row.most_frequent_slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="newsLink"
                        >
                            <h3 className="newsHeadline">
                                {row.content_headline}
                            </h3>
                        </a>
                    </div>
                   {row.description && <p className="newsDescription">{row.description}</p>}
                </li>
            ))}
        </ul>
    );
}

export default BigQueryDataDisplay;