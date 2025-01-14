const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController'); 
const authMiddleware = require('../middleware/authMiddleware'); 

router.get('/users', authMiddleware.authenticateToken, userController.getUser);
router.put('/users', authMiddleware.authenticateToken, userController.addPlayerId);
router.delete('/users', authMiddleware.authenticateToken, userController.unAddPlayerId);
router.get('/users/fetch-players', authMiddleware.authenticateToken, userController.getFavoritedPlayers);
router.put('/users/add-favorites', authMiddleware.authenticateToken, userController.addPlayerFavorites);
router.put('/users/add-team', authMiddleware.authenticateToken, userController.addFavoriteTeam);
router.delete('/users/remove-team', authMiddleware.authenticateToken, userController.removeFavoriteTeam);
router.get('/users/fetch-teams', authMiddleware.authenticateToken, userController.getFavoritedTeams);

router.get('/users/bigquery/followed-players', userController.getMostFollowedPlayers);
router.get('/users/bigquery/relevant-news', userController.getMostRelevantNews);
router.get('/users/bigquery/followed-teams', userController.getMostFollowedTeams);
router.get('/users/bigquery/team-news/:teamId', userController.getTeamSpecificNews);
router.get('/users/bigquery/player-news/:playerId', userController.getPlayerNews);
router.post('/users/fetch-youtube-videos', userController.fetchYoutube);

module.exports = router;