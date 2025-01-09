import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import './TeamSpecificNews.css';

function TeamSpecificNews() {
    const [newsData, setNewsData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { teamId } = useParams();
    const backendUrl = 'http://localhost:5000/api/users/bigquery/team-news';
    const cachedDataRef = useRef({});

    useEffect(() => {
        const fetchTeamNews = async () => {
            setLoading(true);
            setError(null);
            const storedData = sessionStorage.getItem(`teamNews_${teamId}`);

            if (storedData) {
                setNewsData(JSON.parse(storedData));
                 setLoading(false);
                return;
            }

            try {
                const response = await fetch(`${backendUrl}/${teamId}`);
                if (!response.ok) {
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }
                const data = await response.json();
                setNewsData(data.data || []);

                  sessionStorage.setItem(`teamNews_${teamId}`, JSON.stringify(data.data)); // Store data in session storage
                   cachedDataRef.current[teamId] = data.data; // store in our state as well
            } catch (err) {
                console.error("Failed to fetch news:", err);
                setError(err.message || 'Failed to fetch news.');
                 setNewsData([]);
            } finally {
              setLoading(false)
            }
        };

        fetchTeamNews();
    }, [teamId, backendUrl]);


      const transformContentType = (contentType) => {
    if (contentType === 'article') return 'news';
    if (contentType === 'video') return 'video';
    return contentType;
  };


    if (loading) {
        return <div>Loading news...</div>;
    }

    if (error) {
        return <div>Error: {error}</div>;
    }

    if (!newsData || newsData.length === 0) {
        return <div>No news found for this team.</div>
    }

    return (
        <div>
            <ul className="newsList">
                {newsData.map((newsItem, index) => {
                    const { slug, content_type, content_headline, description } = newsItem;
                    const contentMlbComLink = `https://www.mlb.com/${transformContentType(content_type)}/${slug}`;

                    return (
                        <li key={index} className="newsItem">
                            <div className="newsLink">
                                <a
                                    href={contentMlbComLink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="newsLink"
                                >
                                    <h3 className="newsHeadline">{content_headline}</h3>
                                </a>
                            </div>
                            {description && <p className="newsDescription">{description}</p>}
                        </li>
                    );
                })}
            </ul>
        </div>
    );
}

export default TeamSpecificNews;