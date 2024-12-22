import React, { useState } from 'react';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import './CreateAccount.css';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Modal, Box } from '@mui/material'

function CreateAccount({ open, handleClose }) {
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault(); // Prevents default form submission
    
    try {
      const response = await axios.post('http://localhost:5000/users', {
        firstName: firstName,
        lastName: lastName,
        email: email,
        password: password
      });
      if(response.status === 201)
      {
        console.log("User created successfully")
        handleClose()
        navigate('/account');
      }
       } catch (error) {
          console.error("Error creating user", error);
      }
    }


  return (
   <Modal
      open={open}
      onClose={handleClose}
      aria-labelledby="create-account-modal-title"
      aria-describedby="create-account-modal-description"
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
         <Container maxWidth="sm" className="create-account-container">
            <Typography variant="h4" gutterBottom>
             Create Account
           </Typography>
           <form onSubmit={handleSubmit} className="create-account-form">
             <TextField
               fullWidth
              label="First Name"
              margin="normal"
             variant="outlined"
             value={firstName}
             onChange={(e) => setFirstName(e.target.value)}
           />
           <TextField
            fullWidth
             label="Last Name"
            margin="normal"
             variant="outlined"
             value={lastName}
             onChange={(e) => setLastName(e.target.value)}
           />
            <TextField
             fullWidth
             label="Email"
             margin="normal"
             variant="outlined"
            type="email"
           value={email}
             onChange={(e) => setEmail(e.target.value)}
          />
           <TextField
              fullWidth
              label="Password"
              margin="normal"
              variant="outlined"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
           />
         <Button type="submit" variant="contained" color="primary">
          Create Account
         </Button>
          <Button onClick={handleClose}>
           Cancel
          </Button>
        </form>
        </Container>
      </Box>
    </Modal>
  );
}

export default CreateAccount;