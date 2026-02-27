const express = require('express');
const router = express.Router();
const analysisService = require('../services/analysisService');

// POST /api/analysis/record
router.post('/record', async (req, res, next) => {
    try {
        const result = await analysisService.recordGameSession(req.body);
        res.json({ success: true, data: result });
    } catch (err) {
        next(err);
    }
});

// GET /api/analysis/profile/:guestId
router.get('/profile/:guestId', async (req, res, next) => {
    try {
        const profile = await analysisService.getProfile(req.params.guestId);
        res.json({ success: true, data: profile });
    } catch (err) {
        next(err);
    }
});

module.exports = router;
