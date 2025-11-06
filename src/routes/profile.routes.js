// src/routes/profile.routes.js
const express = require('express');
const authenticateToken = require('../middleware/auth.middleware');
const { getCompatibleProfiles, getMyProfile, updateMyProfile } = require('../controllers/profile.controller');

const router = express.Router();

router.get('/feed', authenticateToken, getCompatibleProfiles);
router.get('/me', authenticateToken, getMyProfile);
router.put('/me', authenticateToken, updateMyProfile);

module.exports = router;