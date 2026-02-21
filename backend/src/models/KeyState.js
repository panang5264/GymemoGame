const mongoose = require('mongoose')

const MAX_KEYS = 9

const keyStateSchema = new mongoose.Schema(
  {
    guestId: { type: String, required: true, unique: true, index: true },
    keys: { type: Number, default: MAX_KEYS, min: 0, max: MAX_KEYS },
  },
  { timestamps: true }
)

keyStateSchema.statics.MAX_KEYS = MAX_KEYS

module.exports = mongoose.model('KeyState', keyStateSchema)
