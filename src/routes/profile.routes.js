// src/routes/profile.routes.js
const express = require('express');
const router = express.Router();
const { updateProfile, getMyProfile, uploadSingle } = require('../controllers/profile.controller');
const auth = require('../middleware/auth'); // Asegúrate de tener este middleware

router.get('/me', auth, getMyProfile);
router.put('/me', auth, uploadSingle, updateProfile);

module.exports = router;