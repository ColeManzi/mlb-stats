import React, { useState, useEffect } from 'react';
import './RelevantNews.css'; // Import CSS file

const RelevantNews = () => {
  const [newsData, setNewsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const cacheKey = 'relevantNewsData'; // Define the cache key

  useEffect(() => {
    const fetchNews = async () => {
      setLoading(true);
      setError(null);

      // Check if cached data exists in sessionStorage
       const cachedData = sessionStorage.getItem(cacheKey);
        if(cachedData) {
          try {
           const parsedCache = JSON.parse(cachedData);
            setNewsData(parsedCache);
            setLoading(false);
            return;
            } catch (e) {
               // Cached data is invalid, continue with API call.
              sessionStorage.removeItem(cacheKey);
                console.log("Cached data is invalid, fetching new data")
            }

      }


      try {
        const response = await fetch('http://localhost:5000/api/users/bigquery/relevant-news');
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const data = await response.json();
         if (data.data) {
             setNewsData(data.data);
             // Store the response data in sessionStorage
             sessionStorage.setItem(cacheKey, JSON.stringify(data.data));
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

  const transformContentType = (contentType) => {
      if (contentType === "article") {
        return "news";
      } else if (contentType === "video") {
        return "video";
      }
      return contentType
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
};

export default RelevantNews;