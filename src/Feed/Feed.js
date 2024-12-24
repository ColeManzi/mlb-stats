import React, { useState, useEffect } from 'react';
import _ from 'lodash'; // Make sure to install lodash if it's not installed

const Feed = () => {
    // State for storing the interaction data
    const [interactionData, setInteractionData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Function to fetch the data
    const fetchData = async () => {
        const url = 'https://storage.googleapis.com/gcp-mlb-hackathon-2025/datasets/mlb-fan-content-interaction-data/mlb-fan-content-interaction-data-000000000000.json';
        
        try {
            const response = await fetch(url);
            const data = await response.json();
            const processedData = processInteractionData(data);
            setInteractionData(processedData);
        } catch (err) {
            setError('Failed to fetch data');
        } finally {
            setLoading(false);
        }
    };

    // Function to process the data (similar to the Python example)
    const processInteractionData = (data) => {
        // Using Lodash to group by 'slug', 'content_type', and 'content_headline'
        const groupedData = _.countBy(data, item => `${item.slug}-${item.content_type}-${item.content_headline}`);

        // Convert grouped data to an array with proper keys
        const result = Object.entries(groupedData).map(([key, num_interactions]) => {
            const [slug, content_type, content_headline] = key.split('-');
            return { slug, content_type, content_headline, num_interactions };
        });

        return result;
    };

    // Use useEffect to fetch the data when the component mounts
    useEffect(() => {
        fetchData();
    }, []); // Empty dependency array to only run once on mount

    // Conditional rendering while loading or if there's an error
    if (loading) {
        return <div>Loading...</div>;
    }

    if (error) {
        return <div>{error}</div>;
    }

    // Function to render the table with processed data
    const renderTable = () => {
        return (
            <table>
                <thead>
                    <tr>
                        <th>Slug</th>
                        <th>Content Type</th>
                        <th>Content Headline</th>
                        <th>Num Interactions</th>
                    </tr>
                </thead>
                <tbody>
                    {interactionData.map((item, index) => (
                        <tr key={index}>
                            <td>{item.slug}</td>
                            <td>{item.content_type}</td>
                            <td>{item.content_headline}</td>
                            <td>{item.num_interactions}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        );
    };

    return (
        <div>
            <h1>MLB Fan Content Interaction Data</h1>
            {renderTable()}
        </div>
    );
};

export default Feed;
