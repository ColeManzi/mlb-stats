    import React, { useState } from 'react';
    import axios from 'axios';

    function YourInterests() {
      const [playerID, setPlayerID] = useState('');
      const [results, setResults] = useState(null);
      const [loading, setLoading] = useState(false);
      const [error, setError] = useState(null);

      const handleSubmit = async () => {
        setLoading(true);
        setError(null);
        try {
          const response = await axios.post('http://localhost:8080/trigger-pipeline', { playerID });
          if (response.status === 200) {
            console.log("pipeline initiated");
            } else {
                setError(`Error calling the backend: ${response.status}`);
            }

            // wait a couple seconds, since the backend needs time to kick off the pipline
            await new Promise(resolve => setTimeout(resolve, 2000));

          const resultsResponse = await axios.get(`http://localhost:8080/get-results?playerID=${playerID}`);
           if (resultsResponse.status === 200) {
              setResults(resultsResponse.data);
           } else {
                setError(`Error getting results from backend: ${resultsResponse.status}`);
            }
        } catch (error) {
          setError(error.message);
        } finally {
          setLoading(false);
        }
      };

      return (
        <div>
          <h1>MLB Data App</h1>
          <input
            type="text"
            placeholder="Enter Player ID"
            value={playerID}
            onChange={(e) => setPlayerID(e.target.value)}
          />
          <button onClick={handleSubmit} disabled={loading}>
            {loading ? 'Loading...' : 'Get Player Info'}
          </button>
          {error && <p style={{ color: 'red' }}>Error: {error}</p>}
          {results && (
            <pre>
                {JSON.stringify(results, null, 2)}
              </pre>
            )}
        </div>
      );
    }

    export default YourInterests;