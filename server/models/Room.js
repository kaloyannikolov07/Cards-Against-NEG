const mongoose = require("mongoose");

const roomSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
  },
  players: [{
    type: String,
  }],
  blackCard: {
    type: String,
    default: null,
  },
  whiteCardsPlayed: {
    type: Map,
    of: [String],
    default: {},
  },
  round: {
    type: Number,
    default: 0,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Room", roomSchema);