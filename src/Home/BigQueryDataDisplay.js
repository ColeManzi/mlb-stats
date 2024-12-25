import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { CircularProgress, Alert, Table, TableBody, TableCell, TableContainer, TableRow, Paper } from '@mui/material';

function BigQueryDataDisplay() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [playerNames, setPlayerNames] = useState({}); // New state for player names


    useEffect(() => {
        const fetchMostFollowedPlayers = async () => {
            setLoading(true);
            setError('');
            try {
                const response = await axios.get('http://localhost:5000/api/users/bigquery');
                if (response.status === 200) {
                    setData(response.data.data);
                    // fetch player names after initial data is fetched
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
        return <Alert severity="error">{error}</Alert>
    }

    if (!data) {
        return <p>No data available.</p>;
    }

    return (
        <TableContainer component={Paper}>
            <Table sx={{ minWidth: 200 }} aria-label="simple table">
                <TableBody>
                    {data.map((row) => (
                         <TableRow
                            key={row.player_id}
                            sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                           >
                            <TableCell component="th" scope="row">
                              {playerNames[row.player_id] || row.player_id}
                            </TableCell>
                            <TableCell align="right">{row.follow_count}</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </TableContainer>
    );
}

export default BigQueryDataDisplay;