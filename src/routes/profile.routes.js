const express = require('express');
const router = express.Router();
const { updateProfile, getMyProfile, uploadFields } = require('../controllers/profile.controller');
const { likeProfile } = require('../controllers/like.controller');
const auth = require('../middleware/auth.middleware');

router.get('/me', auth, getMyProfile);
router.put('/me', auth, uploadFields, updateProfile);
router.post('/like/:targetId', auth, likeProfile);

module.exports = router;