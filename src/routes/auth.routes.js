const express = require('express');
const router = express.Router();
const { signup, login, uploadSingle } = require('../controllers/auth.controller');

router.post('/signup', uploadSingle, signup);
router.post('/login', login);

module.exports = router;