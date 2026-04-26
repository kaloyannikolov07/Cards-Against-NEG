const mongoose = require("mongoose");

const gameSchema = new mongoose.Schema({
  roomCode: {
    type: String,
    required: true,
    unique: true,
  },
  players: [{
    name: String,
    score: {
      type: Number,
      default: 0,
    },
    hand: [String],
    socketId: String,
  }],
  currentRound: {
    type: Number,
    default: 0,
  },
  blackCard: {
    type: String,
    default: null,
  },
  whiteCardsPlayed: {
    type: Map,
    of: [String],
    default: {},
  },
  czarSocketId: {
    type: String,
    default: null,
  },
  roundWinner: {
    type: String,
    default: null,
  },
  gameStatus: {
    type: String,
    enum: ["waiting", "lobby", "answering", "judging", "round-end", "game-ended"],
    default: "waiting",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Game", gameSchema);