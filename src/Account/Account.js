import React, { useState, useEffect } from 'react';
import './Account.css';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

function Account() {
  const [userData, setUserData] = useState(null);
  const [error, setError] = useState(null);
  const navigate = useNavigate();


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

    fetchUserData();
  }, [navigate]);

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
    </div>
  );
}

export default Account;