const mongoose = require('mongoose')

const dailyChallengeSchema = new mongoose.Schema({
    guestId: { type: String, required: true, index: true },
    date: { type: String, required: true }, // Format: YYYY-MM-DD
    completedModes: {
        management: { type: Boolean, default: false },
        calculation: { type: Boolean, default: false },
        spatial: { type: Boolean, default: false }
    },
    allDone: { type: Boolean, default: false },
    rewardClaimed: { type: Boolean, default: false }
}, {
    timestamps: true
})

// Ensure unique entry per player per day
dailyChallengeSchema.index({ guestId: 1, date: 1 }, { unique: true })

module.exports = mongoose.model('DailyChallenge', dailyChallengeSchema)
