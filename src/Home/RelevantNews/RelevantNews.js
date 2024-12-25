import React, { useState, useEffect } from 'react';
import styles from './RelevantNews.css'; // Import CSS Module

const RelevantNews = () => {
  const [newsData, setNewsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchNews = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch('http://localhost:5000/api/users/bigquery/relevant-news');
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const data = await response.json();
        if (data.data) {
          setNewsData(data.data);
        } else {
          throw new Error("No data found in the response");
        }
      } catch (error) {
        console.error('Error fetching news:', error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };
    fetchNews();
  }, []);

  if (loading) {
    return <div>Loading news...</div>;
  }

  if (error) {
    return <div style={{ color: 'red' }}>Error: {error}</div>;
  }

  return (
    <div>
      <ul className="newsList"> {/* No need for styles.newsList */}
        {newsData.map((newsItem, index) => {
          const { slug, content_type, content_headline } = newsItem;
          const contentTypeCat = content_type === 'article' ? 'news' : 'video';
          const contentMlbComLink = `https://www.mlb.com/${contentTypeCat}/${slug}`;

          return (
            <li key={index} className="newsItem">
              <a
                href={contentMlbComLink}
                target="_blank"
                rel="noopener noreferrer"
                className="newsLink"
              >
                <h3 className="newsHeadline">{content_headline}</h3>
              </a>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default RelevantNews;