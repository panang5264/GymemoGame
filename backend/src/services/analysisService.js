const GameAnalysis = require('../models/GameAnalysis');
const CognitiveProfile = require('../models/CognitiveProfile');

async function recordGameSession(data) {
    const { guestId, gameType, level, subLevelId, score, timeTaken, accuracy, moves } = data;

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

async function getProfile(guestId) {
    return await CognitiveProfile.findOne({ guestId });
}

module.exports = { recordGameSession, getProfile };
