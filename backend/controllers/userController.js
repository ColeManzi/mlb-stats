const { ObjectId } = require('mongodb');
const config = require('../config');
const { runQuery } = require('../utils');


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
            SELECT
                player_id,
                COUNT(*) AS follow_count
            FROM
                \`project-sandbox-445319.mlb.content-interaction\`,
                UNNEST(followed_player_ids) AS player_id
            GROUP BY
                player_id
            ORDER BY
                follow_count DESC
            LIMIT 5;
          `;
        const queryResults = await runQuery(sqlQuery);
        console.log(queryResults);
        if (queryResults) {
          res.status(200).json({ data: queryResults });
        } else {
          res.status(500).json({ error: 'Failed to retrieve user data from BigQuery' });
        }
    } catch (error) {
        console.error('Error retrieving user data from BigQuery:', error);
        res.status(500).json({ error: 'Failed to retrieve user data from BigQuery' });
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
                FROM \`project-sandbox-445319.mlb.fan-interaction\`
                
                UNION ALL
                
                SELECT slug, content_type, content_headline
                FROM \`project-sandbox-445319.mlb.more-fan-interaction\`

                UNION ALL

                SELECT slug, content_type, content_headline
                FROM \`project-sandbox-445319.mlb.fan-interaction-3\`

                UNION ALL

                SELECT slug, content_type, content_headline
                FROM \`project-sandbox-445319.mlb.fan-interaction-4\`
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
        console.log(queryResults);
        if (queryResults) {
          res.status(200).json({ data: queryResults });
        } else {
          res.status(500).json({ error: 'Failed to retrieve Relevant News from BigQuery' });
        }
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