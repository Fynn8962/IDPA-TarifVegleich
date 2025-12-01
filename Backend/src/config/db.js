const mongoose = require("mongoose");

module.exports = async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB verbunden");
  } catch (err) {
    console.error("Fehler bei MongoDB", err);
    process.exit(1);
  }
};
