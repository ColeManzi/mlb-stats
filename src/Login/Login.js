import React, { useState } from 'react';
import { Modal, TextField, Button, Box } from '@mui/material';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import CreateAccount from '../CreateAccount/CreateAccount';

function Login({ open, handleClose }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [createAccountModalOpen, setCreateAccountModalOpen] = useState(false);
    const navigate = useNavigate();
    const [loginError, setLoginError] = useState(null);
    const [loadingTeamsPlayers, setLoadingTeamsPlayers] = useState(false);
    const [error, setError] = useState(null);

    const fetchTeamAndPlayerNames = async (playerIds, teamIds) => {
        setLoadingTeamsPlayers(true);
        try {
            let teamNames = [];
            let playerNames = [];

            if (teamIds && teamIds.length > 0) {
                teamNames = await Promise.all(teamIds.map(async (teamId) => {
                    const teamResponse = await axios.get(`https://statsapi.mlb.com/api/v1/teams/${teamId}`);
                    return teamResponse.data.teams[0].name
                }))
                
            }
            if (playerIds && playerIds.length > 0) {
                playerNames = await Promise.all(playerIds.map(async (playerId) => {
                    const playerResponse = await axios.get(`https://statsapi.mlb.com/api/v1/people/${playerId}`);
                    return playerResponse.data.people[0].fullName
                }));
               
            }
            return [...teamNames, ...playerNames]
        } catch (error) {
            console.error('Error fetching favorite teams and players', error);
            setError(
                'Error fetching favorite teams and players'
            );
            return []; // Return empty array in case of error
        } finally {
            setLoadingTeamsPlayers(false);
        }
    };

  const handleLogin = async () => {
    try {
      const response = await axios.post('http://localhost:5000/api/login', {
        email: email,
        password: password,
      });

      if (response.status === 200) {
        const { accessToken, refreshToken, playerIds, teamIds } = response.data;

        // Store the tokens in localStorage
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', refreshToken);

        // Fetch names, and store the names in session storage
        const favoriteNames = await fetchTeamAndPlayerNames(playerIds, teamIds)

        sessionStorage.setItem('favorites', JSON.stringify(favoriteNames));

        setLoginError(null);
        handleClose();
        navigate('/account');
      } else {
        setLoginError('Invalid credentials. Please check your email and password.');
        console.log("Invalid login");
      }
    } catch (error) {
      setLoginError('There was a problem with the login. Please try again.');
      console.error('There was a problem with the login:', error);
    }
  };


  const handleCreateAccount = () => {
    setCreateAccountModalOpen(true);
  };

  const handleCreateAccountModalClose = () => {
    setCreateAccountModalOpen(false);
  };

  return (
    <>
      <Modal
        open={open}
        onClose={handleClose}
        aria-labelledby="login-modal-title"
        aria-describedby="login-modal-description"
      >
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 400,
            bgcolor: 'background.paper',
            border: '2px solid #000',
            boxShadow: 24,
            p: 4,
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
          }}
        >
          <h2>Login</h2>
          <TextField
            label="Email"
            variant="outlined"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <TextField
            label="Password"
            variant="outlined"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
            {loginError && <p style={{ color: 'red' }}>{loginError}</p>}
          <Button variant="contained" color="primary" onClick={handleLogin}>
            Login
          </Button>
          <Button onClick={handleClose}>Cancel</Button>
          <Button onClick={handleCreateAccount}>Create an Account</Button>
        </Box>
      </Modal>
      <CreateAccount
        open={createAccountModalOpen}
        handleClose={handleCreateAccountModalClose}
      />
    </>
  );
}

export default Login;