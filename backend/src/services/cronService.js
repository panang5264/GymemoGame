const cron = require('node-cron');
const DailyChallenge = require('../models/DailyChallenge');
const moment = require('moment-timezone');

const setupCronJobs = () => {
    console.log('🕒 Scheduling Cron Jobs...');

    // Run every midnight (00:00) Thailand time
    cron.schedule('0 0 * * *', async () => {
        try {
            const today = moment().tz('Asia/Bangkok').format('YYYY-MM-DD');
            console.log(`[CRON] 🌙 Midnight Reset triggered for Daily Challenges - Date: ${today}`);

            // Optional: You can explicitly create daily challenge entries for all active users 
            // or perform cleanup of old unfinished challenges here.
            // For now, logging the time-based reset. Real "reset" is handled by the new Date query.

            // Example: removing challenges older than 30 days to save space
            const thirtyDaysAgo = moment().tz('Asia/Bangkok').subtract(30, 'days').format('YYYY-MM-DD');
            const result = await DailyChallenge.deleteMany({ date: { $lt: thirtyDaysAgo } });

            console.log(`[CRON] ✅ Reset complete. Cleaned up ${result.deletedCount} old entries.`);
        } catch (error) {
            console.error('[CRON] ❌ Error in midnight reset:', error);
        }
    }, {
        scheduled: true,
        timezone: "Asia/Bangkok"
    });
};

module.exports = setupCronJobs;
