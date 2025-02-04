const express = require('express');
const { google } = require('googleapis');
const { BigQuery } = require('@google-cloud/bigquery');
const { VertexAI } = require('vertex-ai'); // For Gemini API
const axios = require('axios');
const app = express();

const PROJECT_ID = 'project-sandbox-445319';
const LOCATION = 'us-east1'; 
const YOUTUBE_API_KEY = 'AIzaSyCszR_5XNXMExMUHfHSWNh3mtLBOofY3qU';
const GEMINI_API_KEY = 'AIzaSyDN4BL3Wf8dgvBp0wqLIi81PeJAsDV0g10';

const bigquery = new BigQuery({ projectId: PROJECT_ID });

const vertexAI = new VertexAI({
  projectId: PROJECT_ID,
  location: LOCATION,
  apiKey: GEMINI_API_KEY
});

app.use(express.json()); 

const youtube = google.youtube({
  version: 'v3',
  auth: YOUTUBE_API_KEY
});

const fetchYouTubeVideos = async (searchTerm) => {
  const res = await youtube.search.list({
    part: 'snippet',
    q: searchTerm,
    type: 'video',
    maxResults: 3,
  });

  return res.data.items.map(item => ({
    videoId: item.id.videoId,
    title: item.snippet.title,
    description: item.snippet.description,
    channelTitle: item.snippet.channelTitle,
    publishedAt: item.snippet.publishedAt,
    thumbnailURL: item.snippet.thumbnails.default.url,
    videoURL: `https://www.youtube.com/watch?v=${item.id.videoId}`
  }));
};

const generateGeminiSummary = async (videoUrl) => {
  const response = await axios.post('https://gemini-api-url.com/generateSummary', {
    videoUrl,
    apiKey: GEMINI_API_KEY
  });

  return response.data.summary || "Error generating summary";
};

app.post('/summarize_videos', async (req, res) => {
  try {
    const { searchTerm } = req.body;

    if (!searchTerm) {
      return res.status(400).json({ error: "Search term is required" });
    }

    // Fetch YouTube videos based on search term
    const youtubeVideos = await fetchYouTubeVideos(searchTerm);

    // Generate summaries for each video
    for (const video of youtubeVideos) {
      video.summary = await generateGeminiSummary(video.videoURL);
    }

    res.json(youtubeVideos);
  } catch (error) {
    console.error('Error summarizing videos:', error);
    res.status(500).json({ error: 'An error occurred while processing videos' });
  }
});

// Start the server
const port = process.env.PORT || 8080;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
