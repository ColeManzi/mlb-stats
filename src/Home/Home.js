import React, { useState, useEffect } from 'react';
import './Home.css';
import mlbLogo from '../assets/mlb_logo.png';
import PersonIcon from '@mui/icons-material/Person';
import Login from '../Login/Login';
import { useNavigate } from 'react-router-dom';
import BigQueryDataDisplay from './BigQueryDataDisplay/BigQueryDataDisplay';
import GameStats from './GameStats/GameStats'
import RelevantNews from './RelevantNews/RelevantNews';

function Home() {
    const [searchQuery, setSearchQuery] = useState(''); // Combined search term for players and teams
    const [teams, setTeams] = useState([]);
    const [allPlayers, setAllPlayers] = useState([]); // Store all players initially
    const [filteredPlayers, setFilteredPlayers] = useState([]); // Players after filtering
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [dropdownVisible, setDropdownVisible] = useState(false); // Control visibility of combined dropdown
    const navigate = useNavigate();
    const [openLogin, setLoginOpen] = useState(false);

    useEffect(() => {
      const fetchAllPlayers = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch('https://statsapi.mlb.com/api/v1/sports/1/players');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            setAllPlayers(data.people || []); // Store all players
            setFilteredPlayers(data.people || []); //Initial full list for filtering
        } catch (error) {
            console.error("Error fetching all players:", error);
            setError("Failed to load players.");
        } finally {
            setLoading(false);
        }
      };
        fetchAllPlayers();
    }, []);
    
    useEffect(() => {
      if (!searchQuery) {
          setFilteredPlayers(allPlayers); // Show all players if the search is empty.
          return;
      }
      const filtered = allPlayers.filter((player) =>
          player.fullName.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredPlayers(filtered); // Update filtered players state with filtered list
     }, [searchQuery, allPlayers]);

    useEffect(() => {
      const fetchTeams = async () => {
        if (!searchQuery) {
          setTeams([]);
          return;
        }

        try {
          const response = await fetch('https://statsapi.mlb.com/api/v1/teams?sportId=1');
          if (!response.ok) {
              throw new Error(`HTTP error! status: ${response.status}`);
          }
          const json = await response.json();
          const matchingTeams = json.teams.filter(team =>
              team.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
              team.locationName.toLowerCase().includes(searchQuery.toLowerCase())
          );
          setTeams(matchingTeams);
        } catch (error) {
          console.error("Error fetching teams:", error);
          setError("Failed to load teams.");
        }
      };
      fetchTeams();
    }, [searchQuery]);

    const handleItemClick = (item, type) => {
        setSearchQuery(item.name);
        setDropdownVisible(false); // Hide dropdown after selection
      
        if (type === 'team') {
            navigate(`/team/${item.id}/${item.name}`);
        } else if (type === 'player') {
             navigate(`/player/${item.id}/${item.fullName}`); 
        }
      
    };

    const handleInputChange = (e) => {
        setSearchQuery(e.target.value);
        setDropdownVisible(true); // Show dropdown on input change
    };

    const handleIconClick = () => {
      const accessToken = localStorage.getItem('accessToken');
      if (accessToken) {
        navigate('/account');
      } else {
        setLoginOpen(true);
      }
    };
    const handleLoginClose = () => {
      setLoginOpen(false); // Close the modal
    };
    
    return (
        <div className="App">
            <div className="App-search">
                <img src={mlbLogo} className="App-logo" alt="MLB Logo" />
                <header>
                    <PersonIcon 
                        style={{
                            marginRight: '10px', 
                            cursor: 'pointer', 
                            color: 'black',            
                            position: 'absolute',      
                            top: '20px',               
                            right: '20px',
                            fontSize: `40px`             
                        }} 
                        onClick={handleIconClick}
                    />
                    <Login open={openLogin} handleClose={handleLoginClose} />
                    <h1 className='title'>MLB Fan Hub</h1>
                    <input
                        type="text"
                        placeholder="Search for MLB Teams or Players"
                        value={searchQuery}
                        onChange={handleInputChange}
                        className='search-bar-home'
                    />
                  {loading && <p>Loading...</p>}
                  {error && <p>{error}</p>}
                    {dropdownVisible && (teams.length > 0 || filteredPlayers.length > 0) && (
                        <ul className="search-dropdown">
                            {teams.map((team) => (
                                <li key={team.id} onClick={() => handleItemClick(team, 'team')}>
                                    {team.name} ({team.locationName})
                                </li>
                            ))}
                            {filteredPlayers.map((player) => (
                                <li key={player.id} onClick={() => handleItemClick(player, 'player')}>
                                    {player.fullName}
                                </li>
                            ))}
                        </ul>
                    )}
                </header>
            </div>
            <div className="App-feed">
                <GameStats />
            </div>
            <div className="Card-container-left-top">
                <BigQueryDataDisplay />
            </div>
            <div className="Card-container-left-bottom">
                <h1 className='sub-title'>Trending</h1>
                <RelevantNews />
            </div>
            <div className="Card-container-right">
                <h1 className='sub-title'>Daily Digest</h1>
            </div>
        </div>
    );
}

export default Home;