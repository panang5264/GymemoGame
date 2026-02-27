const rateLimit = require('express-rate-limit');

// General rate limiter for most API routes
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    limit: 500, // Limit each IP to 500 requests per `window` (here, per 15 minutes).
    standardHeaders: 'draft-7', // draft-6: `RateLimit-*` headers; draft-7: combined `RateLimit` header
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers.
    message: { success: false, message: 'คำขอเข้าใช้งานมากเกินไป โปรดลองใหม่อีกครั้งในภายหลัง' }
});

// Stricter rate limiter for score submissions to prevent spam
const scoreSubmissionLimiter = rateLimit({
    windowMs: 5 * 60 * 1000, // 5 minutes
    limit: 50, // Limit each IP to 50 score submissions per 5 minutes
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: { success: false, message: 'ส่งข้อมูลบ่อยเกินไป โปรดรอสักครู่' }
});

module.exports = { apiLimiter, scoreSubmissionLimiter };
