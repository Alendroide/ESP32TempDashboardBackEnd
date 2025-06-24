const express = require('express');
const router = express.Router();
const controller = require('../controllers/general.controller');

router.get('/stats', controller.getStats)

module.exports = router;