import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import './Games.css'; // Import the CSS file

const Games = ({ firstYearOfPlay }) => {
    const { teamId } = useParams();
    const [games, setGames] = useState([]);
    const [loading, setLoading] = useState(true);
    const [gameType, setGameType] = useState('R'); // Default to regular season games
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear()); // Default to current year
    const gamesContainerRef = useRef(null);

    // Dropdown change handlers
    const handleGameTypeChange = (event) => {
        setGameType(event.target.value);
    };

    const handleYearChange = (event) => {
        setSelectedYear(parseInt(event.target.value, 10)); // Convert the year to a number
    };

    useEffect(() => {
        const fetchGames = async () => {
            setLoading(true);
            try {
                const response = await fetch(
                    `https://statsapi.mlb.com/api/v1/schedule?sportId=1&teamId=${teamId}&season=${selectedYear}&gameTypes=${gameType}`
                );
                const data = await response.json();

                const gameList = data.dates
                  .flatMap(date => date.games)
                  .filter(game => game.teams.home.score != null && game.teams.away.score != null)
                  .sort((a, b) => new Date(b.gameDate) - new Date(a.gameDate));


                setGames(gameList);
            } catch (error) {
                console.error('Error fetching game data:', error);
                 setGames([]);
            } finally {
                setLoading(false);
            }
        };

        fetchGames();
    }, [teamId, gameType, selectedYear]);

    // Generate year options dynamically
    const generateYearOptions = () => {
        if (!firstYearOfPlay) return [];
        const currentYear = new Date().getFullYear();
        const years = [];
        for (let year = currentYear; year >= firstYearOfPlay; year--) {
            years.push(year);
        }
        return years;
    };

  return (
    <div className="games-container-wrapper">
      <div className="games-header">
        <div className="game-type-selector">
          <label htmlFor="game-type">Select Game Type: </label>
          <select id="game-type" value={gameType} onChange={handleGameTypeChange}>
            <option value="R">Regular Season</option>
            <option value="P">Postseason</option>
            <option value="S">Spring Training</option>
          </select>
        </div>

        <div className="game-year-selector">
          <label htmlFor="game-year">Select Year: </label>
          <select id="game-year" value={selectedYear} onChange={handleYearChange}>
            {generateYearOptions().map(year => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="games-list" ref={gamesContainerRef}>
        {loading ? (
          <div>Loading games...</div>
        ) : games.length === 0 ? (
          <div>
            {gameType === 'R' && 'No regular season games for this team.'}
            {gameType === 'P' && 'There are no postseason games for this team.'}
            {gameType === 'S' && 'No spring training games for this team.'}
          </div>
        ) : (
          <div className="games-container">
            {games.map(game => {
              const isHomeTeam = game.teams.home.team.id === parseInt(teamId);
              const teamScore = isHomeTeam ? game.teams.home.score : game.teams.away.score;
              const opponentScore = isHomeTeam ? game.teams.away.score : game.teams.home.score;
              const date = game.officialDate;
              const result =
              teamScore > opponentScore
                ? 'W'
                : teamScore < opponentScore
                ? 'L'
                : 'T';              

              return (
                <div key={game.gamePk} className="game-card">
                  <div className="team-row">
                    <span>{game.teams.away.team.name}</span>
                    <span className="team-score">{game.teams.away.score}</span>
                  </div>
                  <div className="team-row">
                    <span>{game.teams.home.team.name}</span>
                    <span className="team-score">{game.teams.home.score}</span>
                  </div>
                  <div className={`game-result ${result === 'W' ? 'win' : result === 'L' ? 'loss' : 'tie'}`}>                        {result}
                  </div>
                    <div>
                      <p>{date}</p>
                    </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};


export default Games;