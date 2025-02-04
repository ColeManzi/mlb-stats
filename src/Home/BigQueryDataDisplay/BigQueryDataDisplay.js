import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { CircularProgress, Alert, Button, Typography, Box } from '@mui/material';
import { KeyboardArrowDown, KeyboardArrowUp } from '@mui/icons-material';
import './BigQueryDataDisplay.css'; // Import the CSS file


function BigQueryDataDisplay() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [playerNames, setPlayerNames] = useState({});
    const [newsType, setNewsType] = useState('player'); // 'player' or 'team'
    const cacheKey = newsType === 'player' ? 'mostFollowedPlayersData' : 'mostFollowedTeamsData';

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            setError('');

             // Check if cached data exists in sessionStorage
             const cachedData = sessionStorage.getItem(cacheKey);
            if(cachedData) {
              try {
                const parsedCache = JSON.parse(cachedData);
                 setData(parsedCache);
                 if(newsType === 'player') fetchPlayerNames(parsedCache);
                 if(newsType === 'team') fetchTeamNames(parsedCache)

                setLoading(false);
                return;
              } catch (e) {
                // Cached data is invalid, continue with API call.
                sessionStorage.removeItem(cacheKey);
                  console.log("Cached data is invalid, fetching new data")
              }
            }

            try {
                const apiUrl = newsType === 'player'
                    ? `${process.env.REACT_APP_API_URL}/api/users/bigquery/followed-players`
                    : `${process.env.REACT_APP_API_URL}/api/users/bigquery/followed-teams`;

                const response = await axios.get(apiUrl);
                if (response.status === 200) {
                    setData(response.data.data);
                     sessionStorage.setItem(cacheKey, JSON.stringify(response.data.data));
                    if(newsType === 'player') fetchPlayerNames(response.data.data);
                    if(newsType === 'team') fetchTeamNames(response.data.data)

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
        fetchData();
    }, [newsType]);

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

    const fetchTeamNames = async (teams) => {
        try {
            const namePromises = teams.map(async (team) => {
               const teamId = team.team_id;

                try {
                    const response = await axios.get(`https://statsapi.mlb.com/api/v1/teams/${teamId}`);
                    if(response.data && response.data.teams && response.data.teams[0])
                    {
                      const teamName = response.data.teams[0].name;
                       return { [teamId]: teamName };
                    }else{
                       console.log(`Failed to get name of team ${teamId}`);
                       return { [teamId] : "Name Not Found"}
                    }

                } catch (err) {
                   console.error(`Error fetching team name for ${teamId}`, err);
                   return { [teamId]: "Name Not Found"}
                }
            });

            const nameResults = await Promise.all(namePromises);

             const namesObject = nameResults.reduce((acc, curr) => ({...acc, ...curr}), {});
            setPlayerNames(namesObject);

        } catch (err) {
            console.error('Error during team name fetching', err)
            setError('Error during team name fetching');
        }
    }

    const handleToggleNewsType = () => {
        setNewsType(prevType => prevType === 'player' ? 'team' : 'player');
    };

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
        <div>
             <Box display="flex" alignItems="center" justifyContent="center" mb={2}>
                 <Button onClick={handleToggleNewsType}
                        endIcon={newsType === 'player' ? <KeyboardArrowDown /> : <KeyboardArrowUp />}
                    >
                        <Typography variant="h4" className='sub-title' sx={{ fontWeight: 'bold', color: 'black' }}>
                          {newsType === 'player' ? 'Player News' : 'Team News'}
                         </Typography>
                    </Button>
                </Box>
            <ul className="newsList">
                {data.map((row) => (
                    <li key={newsType === 'player' ? row.player_id : row.team_id} className="newsItem">
                        {newsType === 'player' && playerNames[row.player_id] && (
                            <p className="newsPlayerName">
                             <strong>{playerNames[row.player_id]}:</strong>
                            </p>
                         )}

                       {newsType === 'team' && playerNames[row.team_id] && (
                            <p className="newsPlayerName">
                             <strong>{playerNames[row.team_id]}:</strong>
                            </p>
                        )}
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
        </div>
    );
}

export default BigQueryDataDisplay;