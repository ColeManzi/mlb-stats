const { ObjectId } = require('mongodb');
const config = require('../config');
const { runQuery } = require('../utils');

const { GoogleGenerativeAI, Part } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.REACT_APP_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-pro" });

const getUser = async (req, res) => {
  const { usersCollection } = config.getDb()
    try {
        if (!usersCollection) {
            return res.status(500).send('usersCollection not initialized.');
        }
        console.log("About to fetch users from the DB");
        const user = await usersCollection.findOne({ _id: new ObjectId(req.user.userId) });
        console.log("Fetched user:", user);
        res.json(user);
    } catch (err) {
        console.error("Error fetching user:", err);
        res.status(500).send("Error fetching user");
    }
};

const addPlayerId = async (req, res) => {
    const { usersCollection } = config.getDb();
    const { playerId } = req.body;
     try {
       if(!usersCollection){
         return res.status(500).send('usersCollection not initialized.');
       }

        const result = await usersCollection.updateOne(
            { _id: new ObjectId(req.user.userId) },
            { $addToSet: { playerIds: playerId } } // Use $addToSet to avoid duplicates
        );

        if (result.modifiedCount > 0) {
            res.status(200).json({ message: 'Player ID added successfully.' });
        } else {
            res.status(404).json({ message: 'Adding: User not found or player ID was already added.' });
        }
     } catch (error) {
      console.error("Error adding player ID", error);
        res.status(500).json({ message: 'Error adding player ID', error: error.message });
    }
}

const unAddPlayerId = async (req, res) => {
    const { usersCollection } = config.getDb();
    const { playerId } = req.body;
     try {
       if(!usersCollection){
         return res.status(500).send('usersCollection not initialized.');
       }

        const result = await usersCollection.updateOne(
            { _id: new ObjectId(req.user.userId) },
            { $pull: { playerIds: playerId } }
        );

        if (result.modifiedCount > 0) {
            res.status(200).json({ message: 'Player ID removed successfully.' });
        } else {
            res.status(404).json({ message: 'UnAdding: ser not found or player ID was not in list.' });
        }
     } catch (error) {
        console.error("Error removing player ID", error);
        res.status(500).json({ message: 'Error removing player ID', error: error.message });
    }
}

const getFavoritedPlayers = async (req, res) => {
    const { usersCollection } = config.getDb();
    try {
      if(!usersCollection){
        return res.status(500).send('usersCollection not initialized.');
      }
 
       const user = await usersCollection.findOne({ _id: new ObjectId(req.user.userId) });
 
       if(!user) {
            console.log(req.user.id);
           return res.status(404).json({ message: "User not found"});
       }
      
       res.status(200).json({ playerIds: user.playerIds });
    } catch (error) {
       console.error("Error fetching player IDs", error);
       res.status(500).json({ message: 'Error fetching player IDs', error: error.message });
   }
}

const getFavoritedTeams = async (req, res) => {
    const { usersCollection } = config.getDb();
    try {
        if (!usersCollection) {
            return res.status(500).send('usersCollection not initialized.');
        }

        const user = await usersCollection.findOne({ _id: new ObjectId(req.user.userId) });

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        res.status(200).json({ teamIds: user.teamIds });

    } catch (error) {
        console.error("Error fetching team IDs", error);
        res.status(500).json({ message: 'Error fetching team IDs', error: error.message });
    }
};

const getMostFollowedPlayers = async (req, res) => {
    try {
        const sqlQuery = `
            WITH MostFollowedPlayers AS (
                SELECT
                    CAST(player_id AS INT64) as player_id,
                    RANK() OVER (ORDER BY COUNT(*) DESC) as player_rank
                FROM
                    \`project-sandbox-445319.mlb.content-interaction\`,
                    UNNEST(followed_player_ids) AS player_id
                GROUP BY
                    player_id
                ORDER BY
                    COUNT(*) DESC
            ),
            Top5Players AS (
            SELECT player_id, player_rank
            FROM MostFollowedPlayers
            WHERE player_rank <= 20
            ),
            ContentForTopPlayers AS (
            SELECT
                    p.player_id,
                    afi.slug,
                    afi.content_type,
                    afi.content_headline
                FROM
                    \`project-sandbox-445319.mlb.all-fan-interaction\` afi
                CROSS JOIN Top5Players p
                WHERE p.player_id IN UNNEST(afi.player_tags)
                AND afi.content_type = 'article'

            ),
                SlugCounts AS (
                SELECT
                    player_id,
                    slug,
                    content_type,
                    content_headline,
                    COUNT(*) AS slug_count,
                    RANK() OVER (PARTITION BY player_id ORDER BY COUNT(*) DESC) AS slug_rank
                FROM
                    ContentForTopPlayers
                GROUP BY
                    player_id, slug, content_type, content_headline
            ),
            TopArticlePerPlayer AS (
                SELECT
                p.player_id,
                slug as most_frequent_slug,
                content_type,
                content_headline
                FROM SlugCounts s JOIN Top5Players p ON s.player_id = p.player_id
                WHERE slug_rank = 1
            )
            SELECT
                tap.player_id,
                tap.most_frequent_slug,
                tap.content_type,
                tap.content_headline
            FROM TopArticlePerPlayer tap JOIN Top5Players tp on tap.player_id = tp.player_id
            ORDER BY tp.player_rank ASC;
          `;
          const queryResults = await runQuery(sqlQuery);

        if (!queryResults) {
        return res.status(500).json({ error: 'Failed to retrieve user data from BigQuery' });
        }
  
        const resultsWithDescriptions = await Promise.all(queryResults.map(async (item) => {
            try {
                const description = await generateDescription(item.content_headline);
                return {
                    ...item,
                    description,
                };
            } catch (error) {
                console.error(`Error generating description for ${item.content_headline}:`, error);
                return {
                    ...item,
                    description: 'Failed to generate description',
                };
            }
        }));
        res.status(200).json({ data: resultsWithDescriptions });
    } catch (error) {
            console.error('Error retrieving user data from BigQuery:', error);
            res.status(500).json({ error: 'Failed to retrieve user data from BigQuery' });
    }
};

const getMostFollowedTeams = async (req, res) => {
    try {
        const sqlQuery = `
            WITH MostFollowedTeams AS (
                SELECT
                    CAST(team_id AS INT64) as team_id,
                    RANK() OVER (ORDER BY COUNT(*) DESC) as team_rank
                FROM
                    \`project-sandbox-445319.mlb.content-interaction\`,
                    UNNEST(followed_team_ids) AS team_id
                GROUP BY
                    team_id
                ORDER BY
                    COUNT(*) DESC
            ),
            Top5Teams AS (
                SELECT team_id, team_rank
                FROM MostFollowedTeams
                WHERE team_rank <= 20
            ),
            ContentForTopTeams AS (
                SELECT
                    t.team_id,
                    afi.slug,
                    afi.content_type,
                    afi.content_headline
                FROM
                    \`project-sandbox-445319.mlb.all-fan-interaction\` afi
                CROSS JOIN Top5Teams t
                WHERE t.team_id IN (SELECT SAFE_CAST(id as INT64) FROM UNNEST(afi.team_ids) as id)
                AND afi.content_type = 'article'
            ),
            SlugCounts AS (
                SELECT
                    team_id,
                    slug,
                    content_type,
                    content_headline,
                    COUNT(*) AS slug_count,
                    RANK() OVER (PARTITION BY team_id ORDER BY COUNT(*) DESC) AS slug_rank
                FROM
                    ContentForTopTeams
                GROUP BY
                    team_id, slug, content_type, content_headline
            ),
            TopArticlePerTeam AS (
                SELECT
                t.team_id,
                slug as most_frequent_slug,
                content_type,
                content_headline
                FROM SlugCounts s JOIN Top5Teams t ON s.team_id = t.team_id
                WHERE slug_rank = 1
            )
            SELECT
                tap.team_id,
                tap.most_frequent_slug,
                tap.content_type,
                tap.content_headline
            FROM TopArticlePerTeam tap JOIN Top5Teams tt on tap.team_id = tt.team_id
            ORDER BY tt.team_rank ASC;
        `;
        const queryResults = await runQuery(sqlQuery);

        if (!queryResults) {
        return res.status(500).json({ error: 'Failed to retrieve user data from BigQuery' });
        }
  
        const resultsWithDescriptions = await Promise.all(queryResults.map(async (item) => {
            try {
                const description = await generateDescription(item.content_headline);
                return {
                    ...item,
                    description,
                };
            } catch (error) {
                console.error(`Error generating description for ${item.content_headline}:`, error);
                return {
                    ...item,
                    description: 'Failed to generate description',
                };
            }
        }));
        res.status(200).json({ data: resultsWithDescriptions });
    } catch (error) {
            console.error('Error retrieving user data from BigQuery:', error);
            res.status(500).json({ error: 'Failed to retrieve user data from BigQuery' });
    }
};

const generateDescription = async (headline) => {
    try {
        const prompt = `Create a brief description of this headline: ${headline}, to go beneath it on a web page. Limit the description to 25 words or less. Don't mention the year unless the headline includes it.`;
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        return text;
    } catch (error) {
      console.error('Error generating description:', error);
      throw new Error('Failed to generate description');
    }
};

const getMostRelevantNews = async (req, res) => {
    try {
        const sqlQuery = `
            SELECT 
                slug, 
                content_type, 
                content_headline, 
                COUNT(*) AS num_interactions
            FROM (
            SELECT slug, content_type, content_headline
            FROM \`project-sandbox-445319.mlb.all-fan-interaction\`
            )
            WHERE 
                content_type = 'article' 
                AND NOT (
                    slug = 'c-2523586283' AND
                    content_type = 'video' AND
                    content_headline = 'Gameday Video Placement clip'
                )
            GROUP BY 
                slug, 
                content_type, 
                content_headline
            ORDER BY 
                num_interactions DESC
            LIMIT 15;
          `;
        const queryResults = await runQuery(sqlQuery);
        
        if (!queryResults) {
            return res.status(500).json({ error: 'Failed to retrieve Relevant News from BigQuery' });
        }
        
        const resultsWithDescriptions = await Promise.all(queryResults.map(async (item) => {
             try {
                const description = await generateDescription(item.content_headline);
                return {
                  ...item,
                  description,
                };
              } catch (error) {
                console.error(`Error generating description for ${item.content_headline}:`, error);
                return {
                  ...item,
                  description: 'Failed to generate description',
                };
              }
            }));


        res.status(200).json({ data: resultsWithDescriptions });
    } catch (error) {
        console.error('Error retrieving Relevant News from BigQuery:', error);
        res.status(500).json({ error: 'Failed to retrieve Relevant News from BigQuery' });
    }
};

const getTeamSpecificNews = async (req, res) => {
    const { teamId } = req.params; // Assuming teamId is passed in the URL params (e.g., /news/123)

    if (!teamId) {
        return res.status(400).json({ error: 'teamId is required in the request parameters.' });
    }


    try {
        const sqlQuery = `
            SELECT 
                slug, 
                content_type, 
                content_headline,
                COUNT(*) AS num_interactions
            FROM 
                \`project-sandbox-445319.mlb.all-fan-interaction\`
            WHERE 
                @teamIdParam IN UNNEST(team_ids)
                AND content_type = 'article'
                AND NOT (
                    slug = 'c-2523586283' AND
                    content_type = 'video' AND
                    content_headline = 'Gameday Video Placement clip'
                )
            GROUP BY 
                slug, 
                content_type, 
                content_headline
            ORDER BY 
                num_interactions DESC
            LIMIT 15;
          `;


        const queryResults = await runQuery(sqlQuery, { teamIdParam: teamId }); // Passing teamId as parameter to big query,
       
        if (!queryResults) {
            return res.status(500).json({ error: 'Failed to retrieve team-specific news from BigQuery' });
        }
        
         const resultsWithDescriptions = await Promise.all(queryResults.map(async (item) => {
             try {
                const description = await generateDescription(item.content_headline);
                return {
                  ...item,
                  description,
                };
              } catch (error) {
                console.error(`Error generating description for ${item.content_headline}:`, error);
                return {
                  ...item,
                  description: 'Failed to generate description',
                };
              }
            }));



        res.status(200).json({ data: resultsWithDescriptions });
    } catch (error) {
        console.error('Error retrieving team-specific news from BigQuery:', error);
        res.status(500).json({ error: 'Failed to retrieve team-specific news from BigQuery' });
    }
};

const getPlayerNews = async (req, res) => {
    const { playerId } = req.params;

    if (!playerId) {
        return res.status(400).json({ error: 'Player ID is required in the request parameters.' });
    }

    const playerIdInt = parseInt(playerId, 10);

    try {
        const sqlQuery = `
            SELECT 
                slug, 
                content_type, 
                content_headline, 
                COUNT(*) AS num_interactions
            FROM 
                \`project-sandbox-445319.mlb.all-fan-interaction\`,
                UNNEST(player_tags) AS playerId
            WHERE 
                playerId = @playerIdParam
                AND content_type = 'article'
            GROUP BY 
                slug, 
                content_type, 
                content_headline
            ORDER BY 
                num_interactions DESC
            LIMIT 15;
          `;
    
        const queryResults = await runQuery(sqlQuery, { playerIdParam: playerIdInt });

        if (!queryResults || queryResults.length === 0) {
           return res.status(404).json({ message: `No news found for player ${playerId}` });
        }
         
        const resultsWithDescriptions = await Promise.all(queryResults.map(async (item) => {
            try {
                const description = await generateDescription(item.content_headline);
                 const link = `https://www.mlb.com/${item.content_type}/${item.slug}`
                 return {
                     title: item.content_headline,
                     description,
                     link
                };
                } catch (error) {
                   console.error(`Error in getPlayerNews, generating description for ${item.content_headline}:`, error);
                   return {
                     title: item.content_headline,
                     description: 'Failed to generate description',
                        link: `https://www.mlb.com/${item.content_type}/${item.slug}`
                    };
                }
           }));



        res.status(200).json({ data: resultsWithDescriptions });
    } catch (error) {
        console.error('Error in getPlayerNews, retrieving player-specific news from BigQuery:', error);
        res.status(500).json({ error: 'Failed to retrieve player-specific news from BigQuery' });
    }
};

const addPlayerFavorites = async (req, res) => {
    const { favoriteTeams, favoritePlayers } = req.body;
    const { usersCollection } = config.getDb();

    if (!Array.isArray(favoriteTeams) || !Array.isArray(favoritePlayers)) {
        return res.status(400).json({ message: 'favoriteTeams and favoritePlayers must be arrays' });
    }

    try {
        if (!usersCollection) {
            return res.status(500).send('usersCollection not initialized.');
        }

        const updatedUser = await usersCollection.findOneAndUpdate(
            { _id: new ObjectId(req.user.userId) },
            {
                $set: {
                    playerIds: favoritePlayers,
                    teamIds: favoriteTeams,
                },
            },
            { returnDocument: 'after'} 
        );

        if (!updatedUser) {
            console.log(req.user.userId);
            return res.status(404).json({ message: "User not found" });
        }

        res.status(200).json({ message: 'Favorites updated successfully', user: updatedUser });

    } catch (error) {
        console.error('Error updating favorites:', error);
        res.status(500).json({ message: 'Error updating favorites', error: error.message });
    }
};

const addFavoriteTeam = async (req, res) => {
    const { usersCollection } = config.getDb();
    const { teamId } = req.body;
    try {
        if(!usersCollection){
            return res.status(500).send('usersCollection not initialized.');
        }

            const result = await usersCollection.updateOne(
                { _id: new ObjectId(req.user.userId) },
                { $addToSet: { teamIds: teamId } }
            );

            if (result.modifiedCount > 0) {
                res.status(200).json({ message: 'Team ID added successfully.' });
            } else {
                res.status(404).json({ message: 'Adding: User not found or Team ID was already added.' });
            }
    } catch (error) {
        console.error("Error adding Team ID", error);
        res.status(500).json({ message: 'Error adding Team ID', error: error.message });
    }
};

const removeFavoriteTeam = async (req, res) => {
    const { usersCollection } = config.getDb();
    const { teamId } = req.body;
    try {
        if(!usersCollection){
            return res.status(500).send('usersCollection not initialized.');
        }

        const result = await usersCollection.updateOne(
            { _id: new ObjectId(req.user.userId) },
            { $pull: { teamIds: teamId } }
        );

        if (result.modifiedCount > 0) {
            res.status(200).json({ message: 'Team ID removed successfully.' });
        } else {
            res.status(404).json({ message: 'UnAdding: user not found or team ID was not in list.' });
        }
    } catch (error) {
        console.error("Error removing team ID", error);
        res.status(500).json({ message: 'Error removing team ID', error: error.message });
    }
};

const fetchYoutube = async (req, res) => {
    const { name } = req.params;

    try {
        const today = new Date();
        const month = String(today.getMonth() + 1).padStart(2, '0'); // Months are 0-indexed
        const day = String(today.getDate()).padStart(2, '0');
        const year = today.getFullYear();
        const formattedDate = `${month}-${day}-${year}`; // Format as YYYY-MM-DD for bigquery

        const sqlQuery = `
            SELECT
                geminiVideoSummary,
                videoURL
            FROM
                \`project-sandbox-445319.youtube_summaries.video_summaries\`
            WHERE
                insertion_timestamp = @date_parameter
                AND search_query = @name_parameter
            LIMIT 1;
          `;
        const queryResults = await runQuery(sqlQuery, { date_parameter: formattedDate, name_parameter: name });

        if (!queryResults || queryResults.length === 0) {
            return res.status(404).json({ message: 'No matching video summary found.' });
        }
        
        const geminiSummary = queryResults[0].geminiVideoSummary;
        const videoURL = queryResults[0].videoURL;

        res.status(200).json({
            data: {
              geminiVideoSummary: geminiSummary,
              videoURL: videoURL
            }
        });

    } catch (error) {
        console.error('Error retrieving video summary from BigQuery:', error);
        res.status(500).json({ error: 'Failed to retrieve video summary from BigQuery' });
    }
};

const formatDate = (date) => {
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Add 1 because getMonth() returns 0-11
    const day = String(date.getDate()).padStart(2, '0');
    const year = date.getFullYear();
    return `${month}-${day}-${year}`;
};

const generateNews = async (req, res) => {
    const { summary } = req.body;
    const { name } = req.params;

    if (!summary) {
        return res.status(400).json({ error: 'Summary is required in the request body' });
    }

    try {
        const prompt = `
        Create a concise news headline and a detailed description from the following summary: ${summary}. The subject of the summary is ${name}.

        The headline should be attention-grabbing and clearly indicate the main topic of the summary.

        The description should include:
        *   Specific details about the most important events mentioned in the summary, explaining why they are significant.
        *   The full names and roles of the key people mentioned, and how they impacted the event.
        *   Quantifiable details whenever possible (e.g., scores, times, dates, amounts, statistics).
        *   If multiple aspects of the topic are mentioned, focus on the most important.

        Keep the description within 80 words. Prioritize key events, people, and details.

        Return a JSON object with the following keys:
        headline:
        description:`;

        const result = await model.generateContent({
            contents: [{
                parts: [{ text: prompt }],
            }]
        });

        const response = result.response;
        let responseText = response.text();

        // Remove code fences, if present
        responseText = responseText.replace(/```json\s*|```/g, '');

        // Try to parse the JSON response
        let responseBody;
        try {
            responseBody = JSON.parse(responseText);

            // Validate the response
            if (!responseBody.headline || !responseBody.description) {
                throw new Error("Could not retrieve json or correct response keys");
            }
        } catch (e) {
            console.log("Could not parse response as json, trying to parse using regex", e);

            const headlineMatch = responseText.match(/headline:\s*(.+)/i);
            const descriptionMatch = responseText.match(/description:\s*(.+)/i);

            if (!headlineMatch || !descriptionMatch) {
                throw new Error("Could not find headline or description keys using regex");
            }

            responseBody = {
                headline: headlineMatch[1].trim(),
                description: descriptionMatch[1].trim(),
            };
        }

        const timestamp = formatDate(new Date());
        /*
        await updateBigQuery({
            body: {
                headline: responseBody.headline,
                description: responseBody.description,
                timestamp: timestamp
            }
        });
        */

        // Only send response after the BigQuery insert is complete
        return res.status(200).json(responseBody); // Return the headline and description

    } catch (error) {
        console.error('Error generating news:', error);
        // Ensure only one response is sent in case of an error
        if (!res.headersSent) {
            return res.status(500).json({ error: 'Failed to generate news', details: error.message });
        }
    }
};

const updateBigQuery = async (req) => {
    const { headline, description, timestamp } = req.body;

    if (!headline || !description || !timestamp) {
        throw new Error('Headline, description, and timestamp are required in the request body');
    }

    try {
        const insertQuery = `
            INSERT INTO \`project-sandbox-445319.youtube_summaries.generated_news\` (headline, description, timestamp)
            VALUES (@headline, @description, @timestamp)
        `;

        const insertResponse = await runQuery(insertQuery, {
            headline,
            description,
            timestamp
        });

        // Assuming insertResponse returns rows, you may need to check success status in a different way.
        if (!insertResponse || insertResponse.length === 0) {
            console.log("Error: Could not insert into BigQuery");
            throw new Error("Could not insert into BigQuery");
        }

    } catch (error) {
        console.error('Error writing to BigQuery:', error);
        throw new Error('Failed to insert news into BigQuery');
    }
};

module.exports = {
    getUser,
    addPlayerId,
    unAddPlayerId,
    getMostFollowedPlayers,
    getMostRelevantNews,
    getMostFollowedTeams,
    getFavoritedPlayers,
    getTeamSpecificNews,
    getPlayerNews,
    addPlayerFavorites,
    getFavoritedTeams,
    addFavoriteTeam,
    removeFavoriteTeam,
    fetchYoutube,
    generateNews
}