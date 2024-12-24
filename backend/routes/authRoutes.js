const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

router.post('/login', authController.login)
router.post('/token', authController.refreshToken)
router.post('/users', authController.createUser)

module.exports = router;