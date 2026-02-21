const mongoose = require('mongoose')

const subLevelSchema = new mongoose.Schema({
  subLevelId: { type: Number, required: true },
  completed: { type: Boolean, default: false },
})

const villageProgressSchema = new mongoose.Schema({
  villageId: { type: Number, required: true },
  subLevels: { type: [subLevelSchema], default: [] },
  unlocked: { type: Boolean, default: false },
})

const playerProgressSchema = new mongoose.Schema(
  {
    guestId: { type: String, required: true, unique: true, index: true },
    currentVillageId: { type: Number, default: 1 },
    villages: { type: [villageProgressSchema], default: [] },
  },
  { timestamps: true }
)

module.exports = mongoose.model('PlayerProgress', playerProgressSchema)
