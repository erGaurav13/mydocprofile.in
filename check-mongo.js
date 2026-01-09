// check-mongo.js
// Simple script to validate MONGO_URI from .env and attempt a connection.
require("dotenv").config();
const mongoose = require("mongoose");

const uri = process.env.MONGO_URI;

if (!uri) {
  console.error("MONGO_URI is not set in environment (.env)");
  process.exit(2);
}

console.log("MONGO_URI:", uri);

const valid = /^mongodb(\+srv)?:\/\//i.test(uri);
if (!valid) {
  console.error(
    "MONGO_URI does not look like a valid MongoDB URI (must start with mongodb:// or mongodb+srv://)"
  );
  process.exit(2);
}

(async () => {
  try {
    await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("OK: connected to MongoDB");
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error(
      "ERROR: could not connect to MongoDB:",
      err && err.message ? err.message : err
    );
    process.exit(1);
  }
})();
