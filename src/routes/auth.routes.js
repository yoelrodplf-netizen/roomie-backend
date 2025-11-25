const express = require('express');
const router = express.Router();
const { signup, login, uploadFields } = require('../controllers/auth.controller');

router.post('/signup', uploadFields, signup);
router.post('/login', login);

module.exports = router;