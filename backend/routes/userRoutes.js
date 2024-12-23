const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authMiddleware = require('../middleware/authMiddleware')

router.get('/users', authMiddleware.authenticateToken, userController.getUser)
router.put('/users', authMiddleware.authenticateToken, userController.addPlayerId);
router.delete('/users', authMiddleware.authenticateToken, userController.unAddPlayerId);
module.exports = router