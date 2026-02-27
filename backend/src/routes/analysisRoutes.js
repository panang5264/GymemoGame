const express = require('express');
const router = express.Router();
const analysisService = require('../services/analysisService');
const { scoreSubmissionLimiter } = require('../middleware/rateLimiter');

// POST /api/analysis/record
router.post('/record', scoreSubmissionLimiter, async (req, res, next) => {
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

// GET /api/analysis/history/:guestId
router.get('/history/:guestId', async (req, res, next) => {
    try {
        const { startDate, endDate } = req.query;
        const history = await analysisService.getHistoricalData(req.params.guestId, startDate, endDate);
        res.json({ success: true, data: history });
    } catch (err) {
        next(err);
    }
});

module.exports = router;
