const mongoose = require('mongoose')

const playerCognitiveProfileSchema = new mongoose.Schema({
    guestId: { type: String, required: true, unique: true, index: true },

    // Aggregate Averages (0-100 scale)
    averages: {
        executiveFunction: { type: Number, default: 0 },
        workingMemory: { type: Number, default: 0 },
        processingSpeed: { type: Number, default: 0 },
        attention: { type: Number, default: 0 }
    },

    // History of progress over time for charting
    progressHistory: [{
        date: { type: Date, default: Date.now },
        overallScore: Number,
        domains: {
            management: Number,
            calculation: Number,
            spatial: Number
        }
    }],

    lastUpdated: { type: Date, default: Date.now }
}, {
    timestamps: true
})

module.exports = mongoose.model('CognitiveProfile', playerCognitiveProfileSchema)
