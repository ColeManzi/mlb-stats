# Fan Highlight Hub

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Technologies Used](#technologies-used)
- [Project Setup](#project-setup)
    - [Prerequisites](#prerequisites)
    - [Installation](#installation)
    - [Environment Variables](#environment-variables)
- [Running the App](#running-the-app)
- [API Documentation](#api-documentation)
- [Future Enhancements](#future-enhancements)
- [Contributing](#contributing)
- [License](#license)

## Overview

Fan Highlight Hub is a web application that provides users with the latest MLB news, personalized based on their favorite players and teams. It offers trending news, game summaries, and a customized Daily Digest powered by AI. The backend is built with Node.js and stores user information in MongoDB, while the frontend is powered by React.js.

## Features

- **Trending News:** Displays popular news articles for MLB players and teams based on fan interactions.
- **Latest Games:** Shows the outcomes of recent MLB games, with AI-generated summaries and video highlights.
- **Player and Team Search:** Users can search for specific players or teams to view detailed information and news.
- **Favorites and Daily Digest:** Registered users can favorite players and teams, receiving tailored updates in the Daily Digest section.
- **Account Management:** Users can sign up, log in, and manage their favorite teams and players.

## Technologies Used

- **Frontend:** React.js
- **Backend:** Node.js with Express
- **Database:** MongoDB
- **APIs:**
    - MLB API: Provides player, team, and game data.
    - YouTube Data API: Fetches game highlight videos.
    - Gemini AI Model: Summarizes news articles and videos into concise descriptions.
- **Cloud Services:**
    - Google Cloud BigQuery: Stores fan interaction data and search results.
    - Google Cloud Functions: Automates content generation tasks.
    - Google Cloud Scheduler: Keeps popular content up-to-date.

## Project Setup

### Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js:** [Download Node.js](https://nodejs.org/)
- **MongoDB:** Either run a local instance or use [MongoDB Atlas](https://www.mongodb.com/atlas/database) for cloud storage.

### Installation

1.  **Clone the repository:**

    ```bash
    git clone https://github.com/ColeManzi/mlb-stats.git
    cd mlb-stats
    ```

2.  **Install frontend dependencies:**

    ```bash
    npm install
    ```

3.  **Install backend dependencies:**

    ```bash
    cd backend
    npm install
    ```

### Environment Variables

1.  In the root of your project, create a `.env` file for frontend configuration.  This file **should not be committed to version control**.  Add the following, replacing the placeholder values with your actual API keys and connection string:

    ```
    REACT_APP_API_KEY=your_google_gemini_api_key
    ```
2.  Now in your backend folder create create another `.env` file for backend configuration. Add the following:

    ```
    DB_PASSWORD=db_username
    DB_USERNAME=db_password
    SECRET_KEY=key used for encryption
    GOOGLE_APPLICATION_CREDENTIALS='../config/project_id.json'
    REACT_APP_API_KEY=your_google_gemini_api_key
    YOUTUBE_API_KEY=youtube api key
    PROJECT_ID=google_project_id
    LOCATION=us-east1
    BIGQUERY_DATASET_ID=dataset_where_you_store_the_gemini_summaries
    ```

    **Important Security Note:** Storing API keys in a `.env` file is fine for local development.  For production deployments, *never* commit the `.env` file. Instead, configure these environment variables directly within your hosting provider (e.g., Heroku, AWS, Google Cloud).

## Running the App

1.  **Start fronted Server:**

    ```bash
    npm start
    ```

2.  **Start backend Server:**

    Open another terminal and run:

    ```bash
    cd backend
    node index.js
    ```

3.  **Access the Application:**

    Once both servers are running, open your browser and navigate to `http://localhost:3000`.

## API Documentation

- **MLB API:** Used to fetch player and team data.  Documentation can be found [here](https://github.com/MajorLeagueBaseball/google-cloud-mlb-hackathon).
- **YouTube Data API:** Retrieves game highlight videos. Learn more [here](https://developers.google.com/youtube/v3).
- **Gemini API:** Summarizes articles and videos into short descriptions. [Gemini API Documentation](https://ai.google.dev/gemini-api/docs).

## Future Enhancements

- **Push Notifications:** Implement notifications for game results and player/team updates.
- **Mobile Optimization:** Improve the user experience on mobile devices.
- **Email Notifications:** Send the user unqiue emails regarding the latest information on their favorited teams/players.
- **Advanced Search:** Allow users to search for specific games, player statistics, and team standings.
- **CI/CD Pipeline:** Automate the build, test, and deployment process with a CI/CD pipeline (e.g., GitHub Actions, GitLab CI).

## Contributing

Contributions are welcome! To contribute:

1.  Fork this repository.
2.  Create a new branch: `git checkout -b feature-branch`.
3.  Make your changes and commit them: `git commit -m 'Add feature'`.
4.  Push to the branch: `git push origin feature-branch`.
5.  Open a pull request.  Please include a clear description of the changes and their purpose.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for more details.
