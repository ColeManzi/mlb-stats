import React, { useState, useEffect } from 'react';
import { GoogleGenerativeAI } from "@google/generative-ai";
import styles from './GameStats.css'; 

const GameStats = () => {
  const [gamesData, setGamesData] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const cacheKey = 'cachedGamesData';
  const cacheExpiryKey = 'cachedGamesExpiry';
  const cacheTime = 24 * 60 * 60 * 1000; 
  const numberOfGamesToFetch = 10; 

  useEffect(() => {
    const fetchMultipleGamesData = async () => {
      const scheduleEndpointUrl = 'https://statsapi.mlb.com/api/v1/schedule?sportId=1&season=2024';

      try {
        const cachedData = localStorage.getItem(cacheKey);
        const cachedExpiry = localStorage.getItem(cacheExpiryKey);

        if (cachedData && cachedExpiry && Date.now() < parseInt(cachedExpiry, 10)) {
          setGamesData(JSON.parse(cachedData));
          setLoading(false); 
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
        const lastTenGames = games.slice(-numberOfGamesToFetch).reverse();

        const gameInfoPromises = lastTenGames.map(async (game) => {
        const gamePk = game.gamePk;

        const singleGameFeedUrl = `https://statsapi.mlb.com/api/v1.1/game/${gamePk}/feed/live`;
        const singleGameResponse = await fetch(singleGameFeedUrl);

        if (!singleGameResponse.ok) {
            throw new Error(`HTTP error! status: ${singleGameResponse.status}`);
        }
        const singleGameInfoJson = await singleGameResponse.json();

        const currentPlay = singleGameInfoJson?.liveData?.plays?.currentPlay;

        if (!currentPlay) {
            throw new Error("No current play data found in the game data.");
        }

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

        const apiKey = process.env.REACT_APP_API_KEY;
        if (!apiKey) {
            throw new Error("Missing REACT_APP_API_KEY environment variable. Cannot access the Google Gemini API.");
        }
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });
        const prompt = `During the game between the home team ${homeTeam} and the away team ${awayTeam}, using the following game play data: ${JSON.stringify(currentPlay)}. Tell me about the last play of the game. Refer to the teams by their names.`;
        const result = await model.generateContent(prompt);
        const gameSummary = result.response.text();


        return {
            gamePk: gamePk,
            summary: gameSummary,
            videoLink: videoUrl,
            awayTeam: awayTeam,
            homeTeam: homeTeam,
            awayScore: awayScore,
            homeScore: homeScore,
        };
        });

        const gamesInfo = await Promise.all(gameInfoPromises);
        setGamesData(gamesInfo);
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
            <h2 className="sub-title">Latest Game Info</h2>
            <ul className="gameList">
                {gamesData.map((gameInfo) => (
                <li key={gameInfo.gamePk} className="gameListItem">
                    <div className="gameSummary">
                    <div className="teamNames">
                        <span className="awayTeam">{gameInfo.awayTeam}</span>
                        <span className="vs"> vs </span>
                        <span className="homeTeam">{gameInfo.homeTeam}</span>
                    </div>
                    <div className="score">
                        <span className="awayScore"> {gameInfo.awayScore}</span> -{' '}
                        <span className="homeScore">{gameInfo.homeScore}</span>
                    </div>
                    <p className="summaryText">{gameInfo.summary}</p>
                    </div>

                    {gameInfo.videoLink && (
                    <a
                        href={gameInfo.videoLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="videoLink"
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