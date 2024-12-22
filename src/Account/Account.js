import React, { useState, useEffect } from 'react';
import './Account.css';
import axios from 'axios';

function Account() {
    const [userData, setUserData] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const email = localStorage.getItem('email'); // Get email from local storage

                if (!email) {
                    setError("Email not found. Please log in.");
                    return;
                }
                const response = await axios.get(`http://localhost:5000/users?email=${email}`); // Send the email as a query parameter

                if (response.status === 200) {
                    setUserData(response.data);
                } else {
                    setError("There was an error fetching user information.");
                }
            } catch (error) {
                console.error("An error occurred:", error);
                setError("There was an error fetching user data.");
            }
        };
        fetchUserData();
    }, []);

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