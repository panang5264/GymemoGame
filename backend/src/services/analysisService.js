const GameAnalysis = require('../models/GameAnalysis');
const CognitiveProfile = require('../models/CognitiveProfile');

async function recordGameSession(data) {
    const { guestId, gameType, level, subLevelId, score, timeTaken, accuracy, moves } = data;

    // Strict Input Validation
    if (!guestId || !gameType || score === undefined || timeTaken === undefined) {
        const err = new Error('กรุณากรอกข้อมูลให้ครบถ้วน');
        err.name = 'ValidationError';
        throw err;
    }

    if (score < 0 || timeTaken < 0 || (accuracy !== undefined && accuracy < 0) || (moves !== undefined && moves < 0)) {
        const err = new Error('ข้อมูลไม่ถูกต้อง (ห้ามติดลบ)');
        err.name = 'ValidationError';
        throw err;
    }

    if (score > 1000000 || timeTaken > 86400 || (accuracy !== undefined && accuracy > 100)) {
        const err = new Error('ข้อมูลผิดปกติ โปรดลองอีกครั้ง');
        err.name = 'ValidationError';
        throw err;
    }

    // 1. Create Game Analysis Entry
    const session = await GameAnalysis.create({
        guestId,
        gameType,
        level,
        subLevelId,
        score,
        timeTaken,
        accuracy,
        moves,
        domainMetrics: calculateDomainMetrics(gameType, score, timeTaken, accuracy)
    });

    // 2. Update/Create Cognitive Profile
    let profile = await CognitiveProfile.findOne({ guestId });
    if (!profile) {
        profile = new CognitiveProfile({ guestId });
    }

    // Update Domain History
    profile.progressHistory.push({
        date: new Date(),
        overallScore: score, // Simple version
        domains: {
            management: gameType === 'management' ? score : (profile.progressHistory.slice(-1)[0]?.domains.management || 0),
            calculation: gameType === 'calculation' ? score : (profile.progressHistory.slice(-1)[0]?.domains.calculation || 0),
            spatial: gameType === 'spatial' ? score : (profile.progressHistory.slice(-1)[0]?.domains.spatial || 0)
        }
    });

    // Keep history manageable
    if (profile.progressHistory.length > 50) profile.progressHistory.shift();

    // Recalculate Averages
    profile.averages = await calculateAverages(guestId);
    profile.weeklyAverages = await calculateWeeklyAverages(guestId);
    profile.lastUpdated = new Date();
    await profile.save();

    return { session, profile };
}

function calculateDomainMetrics(gameType, score, timeTaken, accuracy) {
    // Basic weight logic
    const metrics = { executive: 0, memory: 0, attention: 0, calculation: 0 };
    const normalizedScore = Math.min(100, (score / 15) * 100);

    if (gameType === 'management') metrics.executive = normalizedScore;
    if (gameType === 'calculation') metrics.calculation = normalizedScore;
    if (gameType === 'spatial') metrics.memory = normalizedScore;
    if (gameType === 'reaction') metrics.attention = normalizedScore;

    return metrics;
}

// Helper to get start and end of week (Sunday to Saturday) relative to a date
function getWeekRange(date = new Date()) {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day;
    const startOfWeek = new Date(d.setDate(diff));
    startOfWeek.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    return { startOfWeek, endOfWeek };
}

async function calculateAverages(guestId) {
    const lastSessions = await GameAnalysis.find({ guestId }).sort({ date: -1 }).limit(10);
    if (lastSessions.length === 0) return { executiveFunction: 0, workingMemory: 0, processingSpeed: 0, attention: 0 };

    const sums = lastSessions.reduce((acc, s) => ({
        exec: acc.exec + (s.domainMetrics.executive || 0),
        mem: acc.mem + (s.domainMetrics.memory || 0),
        attn: acc.attn + (s.domainMetrics.attention || 0),
        calc: acc.calc + (s.domainMetrics.calculation || 0),
        count: acc.count + 1
    }), { exec: 0, mem: 0, attn: 0, calc: 0, count: 0 });

    return {
        executiveFunction: sums.exec / sums.count,
        workingMemory: sums.mem / sums.count,
        processingSpeed: sums.calc / sums.count,
        attention: sums.attn / sums.count
    };
}

async function calculateWeeklyAverages(guestId) {
    const { startOfWeek, endOfWeek } = getWeekRange();
    const weeklySessions = await GameAnalysis.find({
        guestId,
        date: { $gte: startOfWeek, $lte: endOfWeek }
    });

    if (weeklySessions.length === 0) return { executiveFunction: 0, workingMemory: 0, processingSpeed: 0, attention: 0 };

    const sums = weeklySessions.reduce((acc, s) => ({
        exec: acc.exec + (s.domainMetrics?.executive || 0),
        mem: acc.mem + (s.domainMetrics?.memory || 0),
        attn: acc.attn + (s.domainMetrics?.attention || 0),
        calc: acc.calc + (s.domainMetrics?.calculation || 0),
        count: acc.count + 1
    }), { exec: 0, mem: 0, attn: 0, calc: 0, count: 0 });

    return {
        executiveFunction: sums.exec / sums.count,
        workingMemory: sums.mem / sums.count,
        processingSpeed: sums.calc / sums.count,
        attention: sums.attn / sums.count
    };
}

async function getProfile(guestId) {
    const profile = await CognitiveProfile.findOne({ guestId });
    if (!profile) return null;
    return profile;
}

async function getHistoricalData(guestId, startDate, endDate) {
    // Pagination & Sorting for stability for large datasets
    const query = { guestId };
    if (startDate && endDate) {
        let end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.date = {
            $gte: new Date(startDate),
            $lte: end
        };
    }

    // Limit to 500 records max for safety, sort newest first
    const history = await GameAnalysis.find(query).sort({ date: -1 }).limit(500);
    return history;
}

module.exports = { recordGameSession, getProfile, getHistoricalData };
