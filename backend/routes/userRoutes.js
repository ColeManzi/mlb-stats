const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController'); 
const authMiddleware = require('../middleware/authMiddleware'); 

router.get('/users', authMiddleware.authenticateToken, userController.getUser);
router.put('/users', authMiddleware.authenticateToken, userController.addPlayerId);
router.delete('/users', authMiddleware.authenticateToken, userController.unAddPlayerId);
router.get('/users/fetch-players', authMiddleware.authenticateToken, userController.getFavoritedPlayers);

router.get('/users/bigquery/followed-players', userController.getMostFollowedPlayers);
router.get('/users/bigquery/relevant-news', userController.getMostRelevantNews);
router.get('/users/bigquery/followed-teams', userController.getMostFollowedTeams);
router.get('/users/bigquery/team-news/:teamId', userController.getTeamSpecificNews);

module.exports = router;