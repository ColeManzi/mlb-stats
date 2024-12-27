const { ObjectId } = require('mongodb');
const config = require('../config');
const { runQuery } = require('../utils');

const { GoogleGenerativeAI } = require("@google/generative-ai");

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
            WHERE player_rank <= 10
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
                NOT (
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
            LIMIT 10;
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


module.exports = {
    getUser,
    addPlayerId,
    unAddPlayerId,
    getMostFollowedPlayers,
    getMostRelevantNews
}