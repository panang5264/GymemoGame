const mongoose = require('mongoose')

const gameAnalysisSchema = new mongoose.Schema({
    guestId: { type: String, required: true, index: true },
    gameType: {
        type: String,
        required: true,
        enum: ['management', 'calculation', 'spatial', 'reaction']
    },
    level: { type: Number, required: true },
    subLevelId: { type: Number },

    // Performance Metrics
    score: { type: Number, required: true },
    timeTaken: { type: Number }, // in seconds
    accuracy: { type: Number }, // percentage 0-100
    moves: { type: Number }, // for maze or sorting steps

    // Brain Domain Analysis
    domainMetrics: {
        executive: { type: Number }, // Management logic
        memory: { type: Number }, // Patterns/Recall
        attention: { type: Number }, // Speed/Focus
        calculation: { type: Number } // Math speed
    },

    date: { type: Date, default: Date.now, index: true }
}, {
    timestamps: true
})

module.exports = mongoose.model('GameAnalysis', gameAnalysisSchema)
