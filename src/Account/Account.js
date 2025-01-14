import React, { useState, useEffect } from 'react';
import './Account.css';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

function Account() {
    const [userData, setUserData] = useState(null);
    const [error, setError] = useState(null);
    const [favoriteTeams, setFavoriteTeams] = useState([]);
    const [favoritePlayers, setFavoritePlayers] = useState([]);
    const navigate = useNavigate();
    const [loadingTeamsPlayers, setLoadingTeamsPlayers] = useState(true);


  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const accessToken = localStorage.getItem('accessToken');

        if (!accessToken) {
          setError('Access token not found. Please log in.');
          navigate("/");
          return;
        }

        const response = await axios.get('http://localhost:5000/api/users', {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

          if (response.status === 200) {
            setUserData(response.data);
              const { playerIds, teamIds} = response.data; // Destructure playerIds and teamIds
              fetchTeamAndPlayerNames(playerIds, teamIds);

        } else {
          setError(
            'There was an error fetching user information.'
          );
        }
      } catch (error) {
           if(error.response && error.response.status === 401){
             setError('Session expired. Please log in.');
             localStorage.removeItem('accessToken')
             localStorage.removeItem('refreshToken')
             navigate("/");
           } else {
            console.error('An error occurred:', error);
            setError('There was an error fetching user data.');
             localStorage.removeItem('accessToken')
             localStorage.removeItem('refreshToken')
            navigate("/");
          }
      }
    };

    const fetchTeamAndPlayerNames = async (playerIds, teamIds) => {
        setLoadingTeamsPlayers(true);
        try {
            if (teamIds && teamIds.length > 0) {
                const teamNames = await Promise.all(teamIds.map(async (teamId) => {
                    const teamResponse = await axios.get(`https://statsapi.mlb.com/api/v1/teams/${teamId}`);
                    return teamResponse.data.teams[0].name
                }))
                setFavoriteTeams(teamNames)
            }
            if (playerIds && playerIds.length > 0) {
                const playerNames = await Promise.all(playerIds.map(async (playerId) => {
                    const playerResponse = await axios.get(`https://statsapi.mlb.com/api/v1/people/${playerId}`);
                    return playerResponse.data.people[0].fullName
                }));
                setFavoritePlayers(playerNames)
            }
        } catch (error) {
            console.error('Error fetching favorite teams and players', error);
            setError(
                'Error fetching favorite teams and players'
            );
        } finally {
            setLoadingTeamsPlayers(false);
        }
    };


    fetchUserData();

  }, [navigate]);

    const handleLogout = (e) => {
        localStorage.removeItem('accessToken')
        localStorage.removeItem('refreshToken')
        navigate("/");
    };

    if (error) {
        return <div className="account-container"><p>Error: {error}</p></div>;
    }

    if (!userData) {
        return <div className="account-container">Loading user data...</div>;
    }

    return (
        <div className="account-container">
            <h2>Account Information</h2>
            <div className="user-info">
                <p>
                    <strong>First Name:</strong> {userData.firstName}
                </p>
                <p>
                    <strong>Last Name:</strong> {userData.lastName}
                </p>
                <p>
                    <strong>Email:</strong> {userData.email}
                </p>
            </div>

            <div className="favorites-container">
                <h3>Favorite Teams</h3>
                {loadingTeamsPlayers ? (<p>Loading Teams and Players...</p>) :
                    (favoriteTeams.length > 0 ? (
                        <ul className="favorites-list">
                            {favoriteTeams.map((team, index) => (
                                <li key={index}>{team}</li>
                            ))}
                        </ul>
                    ) : (
                        <p>No favorite teams selected</p>
                    ))
                }
                <h3>Favorite Players</h3>
                {loadingTeamsPlayers ? null :
                    (favoritePlayers.length > 0 ? (
                            <ul className="favorites-list">
                                {favoritePlayers.map((player, index) => (
                                    <li key={index}>{player}</li>
                                ))}
                            </ul>
                        ) : (
                            <p>No favorite players selected</p>
                        ))
                }
            </div>

            <button onClick={handleLogout}>Logout</button>
        </div>
    );
}

export default Account;