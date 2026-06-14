const express = require('express');
const router = express.Router();
const { getAdvice } = require('../controllers/ai.controller');

router.post('/advice', getAdvice);

module.exports = router;
