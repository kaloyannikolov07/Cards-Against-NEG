const mongoose = require("mongoose");

const connectDB = async () => {
  const mongoURI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/cards-against-neg";
  try {
    await mongoose.connect(mongoURI);
    console.log("MongoDB connected");
  } catch (err) {
    console.error(err);
  }
};

module.exports = connectDB;