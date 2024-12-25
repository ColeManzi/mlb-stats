import React, { useState, useEffect } from 'react';
import { GoogleGenerativeAI } from "@google/generative-ai";
import styles from './GameStats.css'; // Import the CSS Module

const GameStats = () => {
  const [gamesData, setGamesData] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const cacheKey = 'cachedGamesData'; // Key to look for in localStorage
  const cacheExpiryKey = 'cachedGamesExpiry'; // Key for checking expiry time in localStorage
  const cacheTime = 24 * 60 * 60 * 1000; // Set cache to be good for 24 hours
  const numberOfGamesToFetch = 10; //Set to the number of games we want to fetch

  useEffect(() => {
    const fetchMultipleGamesData = async () => {
      const scheduleEndpointUrl = 'https://statsapi.mlb.com/api/v1/schedule?sportId=1&season=2024';

      try {
        // Attempt to retreive cached data
        const cachedData = localStorage.getItem(cacheKey);
        const cachedExpiry = localStorage.getItem(cacheExpiryKey);

        if (cachedData && cachedExpiry && Date.now() < parseInt(cachedExpiry, 10)) {
          setGamesData(JSON.parse(cachedData));
          setLoading(false); // We're done if we found valid cache
          return;
        }
        const scheduleResponse = await fetch(scheduleEndpointUrl);
        if (!scheduleResponse.ok) {
          throw new Error(`HTTP error! status: ${scheduleResponse.status}`);
        }
        const scheduleData = await scheduleResponse.json();
        const scheduleDates = scheduleData.dates;

        if (!scheduleDates || scheduleDates.length === 0) {
          throw new Error(`No games returned from scheduleEndpointUrl: ${scheduleEndpointUrl}`);
        }
        let games = [];
        for (const date of scheduleDates) {
          if (date.games && date.games.length > 0) {
            games = games.concat(date.games);
          }
        }

          if (games.length < numberOfGamesToFetch) {
            throw new Error("Not enough games to process");
          }
        const lastTenGames = games.slice(-numberOfGamesToFetch).reverse(); // Get the last 10 and reverse array

        const gameInfoPromises = lastTenGames.map(async (game) => {
          const gamePk = game.gamePk;

          const singleGameFeedUrl = `https://statsapi.mlb.com/api/v1.1/game/${gamePk}/feed/live`;
          const singleGameResponse = await fetch(singleGameFeedUrl);

          if (!singleGameResponse.ok) {
            throw new Error(`HTTP error! status: ${singleGameResponse.status}`);
          }
          const singleGameInfoJson = await singleGameResponse.json();

          // Extract the last play
          const currentPlay = singleGameInfoJson?.liveData?.plays?.currentPlay;

          if (!currentPlay) {
            throw new Error("No current play data found in the game data.");
          }

          // Get last play event
          const playEvents = currentPlay?.playEvents;

          if (!playEvents || playEvents.length === 0) {
            throw new Error("No play events found in the game data.");
          }

          const lastPlayEvent = playEvents[playEvents.length - 1];
          const playId = lastPlayEvent?.playId;
          if (!playId) {
            throw new Error("No play ID found in the current play data.");
          }
          const awayTeam = singleGameInfoJson?.liveData?.boxscore?.teams?.away?.team?.name;
          const homeTeam = singleGameInfoJson?.liveData?.boxscore?.teams?.home?.team?.name;
          const homeScore = singleGameInfoJson?.liveData?.boxscore?.teams?.home?.teamStats?.batting?.runs;
          const awayScore = singleGameInfoJson?.liveData?.boxscore?.teams?.away?.teamStats?.batting?.runs;

          const videoUrl = `https://www.mlb.com/video/search?q=playid="${playId}"`;

          // Generate text with Gemini API
          const apiKey = process.env.REACT_APP_API_KEY;
          if (!apiKey) {
            throw new Error("Missing REACT_APP_API_KEY environment variable. Cannot access the Google Gemini API.");
          }
          const genAI = new GoogleGenerativeAI(apiKey);
          const model = genAI.getGenerativeModel({ model: "gemini-pro" });
          const prompt = `During the game between the home team ${homeTeam} and the away team ${awayTeam}, using the following game play data: ${JSON.stringify(currentPlay)}. Tell me about the last play of the game. Refer to the teams by their names.`;
          const result = await model.generateContent(prompt);
          const playerSummary = result.response.text();


          return {
            gamePk: gamePk,
            summary: playerSummary,
            videoLink: videoUrl,
            awayTeam: awayTeam,
            homeTeam: homeTeam,
            awayScore: awayScore,
            homeScore: homeScore,
          };
        });

        const gamesInfo = await Promise.all(gameInfoPromises); // Wait for all to complete
        setGamesData(gamesInfo);
        // Cache the data for later
        localStorage.setItem(cacheKey, JSON.stringify(gamesInfo));
        localStorage.setItem(cacheExpiryKey, Date.now() + cacheTime);
      } catch (error) {
        console.error("Error fetching data:", error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchMultipleGamesData();
  }, []);

  if (loading) {
    return <div>Loading game data...</div>;
  }

  if (error) {
    return <div style={{ color: 'red' }}>Error: {error}</div>;
  }

  return (
    <div>
      <h2 style={{ color: 'black', textAlign: 'center', marginBottom: '20px' }}>Latest Game Information</h2>
      <ul className={styles.gameList}>
        {gamesData.map((gameInfo) => (
          <li key={gameInfo.gamePk} className={styles.gameListItem}>
            <div className={styles.gameSummary}>
              <div className={styles.teamNames}>
                <span className={styles.awayTeam}>{gameInfo.awayTeam}</span>
                <span className={styles.vs}> vs </span>
                <span className={styles.homeTeam}>{gameInfo.homeTeam}</span>
              </div>
              <div className={styles.score}>
                <span className={styles.awayScore}> {gameInfo.awayScore}</span> - <span className={styles.homeScore}>{gameInfo.homeScore}</span>
              </div>

              <p className={styles.summaryText}>{gameInfo.summary}</p>
            </div>

            {gameInfo.videoLink && (
              <a
                href={gameInfo.videoLink}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.videoLink}
                aria-label={`View last play video for the game between ${gameInfo.awayTeam} and ${gameInfo.homeTeam} on MLB.com`}
              >
                View Last Play Video
              </a>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default GameStats;