import React, { useState, useEffect, useRef } from 'react';
import './DailyDigest.css';

function DailyDigest() {
    const [summaries, setSummaries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [favorites, setFavoriteNames] = useState([]);
    const accessToken = localStorage.getItem('accessToken');
    const isLoggedIn = !!accessToken;
    const prevFavoritesRef = useRef([]);


    useEffect(() => {
        // Check sessionStorage for favorites and set state
        const storedFavorites = sessionStorage.getItem("favorites");
        if (storedFavorites) {
            try {
                const parsedFavorites = JSON.parse(storedFavorites);
                setFavoriteNames(parsedFavorites);
                console.log('Loaded favorites from sessionStorage', parsedFavorites);
                prevFavoritesRef.current = parsedFavorites;
            } catch (error) {
                console.log('Error loading favorites from session storage', error);
            }
        }

    }, []); // Empty dependency array to load favorites once on mount

    useEffect(() => {
       
        async function fetchSummaries() {
            if (!isLoggedIn) {
                setLoading(false);
                return;
            }

            setLoading(true);
            setError(null);

            // If favorites are empty, stop early
            if (favorites.length === 0) {
                setLoading(false);
                setSummaries([]); // Ensure no summaries are displayed if no favorites.
                return;
            }

            const cacheKey = 'dailyDigestData';
             let cachedData = localStorage.getItem(cacheKey);
             let cachedSummaries = {};
             let cachedFavorites = [];

            if (cachedData) {
                try {
                    const parsedCacheData = JSON.parse(cachedData);
                   if (parsedCacheData && parsedCacheData.summaries) {
                        cachedSummaries = parsedCacheData.summaries.reduce((acc, summary) => {
                             acc[summary.name] = summary;
                             return acc;
                            }, {});
                     }
                    if(parsedCacheData && parsedCacheData.favorites)
                    {
                        cachedFavorites = parsedCacheData.favorites;
                    }


                       console.log('Loaded data from cache', parsedCacheData);
                   
                } catch (error) {
                     console.log("Error parsing cached data, fetching again", error);
                }
            }


            // Fetch from API
            const allSummaryPromises = favorites.map(async (name) => {
                   if (cachedSummaries[name]) {
                         console.log(`Using cached summary for ${name}`);
                            return cachedSummaries[name]; // Use cached if available
                     }
                try {
                    const response = await fetch(`http://localhost:5000/api/users/fetch-youtube-videos/${name}`, {
                        method: 'GET',
                    });

                    if (!response.ok) {
                        if (response.status === 404) {
                            console.log(`No summary found for ${name}`);
                            return null;
                        }
                        throw new Error(`HTTP error! status: ${response.status}`);
                    }

                    const fetchedSummary = await response.json();
                    console.log(`Fetched summary for ${name}:`, fetchedSummary);

                    const generatedNews = await generateNews(fetchedSummary.data.geminiVideoSummary, name);
                   
                    return {
                        name,
                        headline: generatedNews.headline,
                        description: generatedNews.description,
                        url: fetchedSummary.data.videoURL,
                    };

                } catch (error) {
                     console.error(`Error fetching or generating news for ${name}:`, error);
                      return {
                            name,
                            headline: null,
                            description: null,
                        };
                   
                }
            });

            const fetchedSummaries = await Promise.all(allSummaryPromises);

            // Filter out null summaries before setting them
           const filteredSummaries = fetchedSummaries.filter(item => item != null && item.headline !== null && item.description !== null);
            setSummaries(filteredSummaries);

            // Merge fetched summaries with cached summaries, adding or replacing
           const mergedSummaries = filteredSummaries.reduce((acc, summary) => {
                acc[summary.name] = summary;
                return acc
            }, {...cachedSummaries});

               
             localStorage.setItem(cacheKey, JSON.stringify({ summaries: Object.values(mergedSummaries), favorites: favorites}));

            setLoading(false);
             prevFavoritesRef.current = favorites;

        }

        fetchSummaries();

    }, [favorites, isLoggedIn]); // Re-run fetch when favorites or login status changes

    async function generateNews(summary, name) {
         try {
            const response = await fetch(`http://localhost:5000/api/users/generate-news/${name}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ summary }),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const newsData = await response.json();
            console.log(newsData);
            return {
                headline: newsData.headline,
                description: newsData.description,
            };
        } catch (error) {
            console.error("Error generating news", error);
            return {
                headline: null,
                description: null,
            };
        }
    }

    function renderSummaries() {
        if (loading) {
            return <p>Loading summaries...</p>;
        }
        if (error) {
            return <p>Error: {error}</p>;
        }

        if (!isLoggedIn) {
            return <p>Log in and favorite teams/players to get daily digests.</p>;
        }

         if (summaries.length === 0 && favorites.length > 0) {
             return <p>No news found for your favorite teams or players.</p>;
        }
        if (favorites.length === 0) {
             return <p>No teams or players have been selected.</p>;
        }

        return (
            <ul>
                {summaries.map((item) => (
                    <li key={item.name} className="summary-list-item">
                        <div className="summary-details">
                            <h3>{item.headline}</h3>
                            <p>{item.description}</p>
                            <p>
                                <a href={item.url} target="_blank" rel="noopener noreferrer">
                                    {item.url}
                                </a>
                            </p>
                        </div>
                    </li>
                ))}
            </ul>
        );
    }

    return (
        <div>
            {renderSummaries()}
        </div>
    );
}

export default DailyDigest;