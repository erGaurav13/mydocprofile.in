const app = require("./app");
const mongoose = require("mongoose");
const { sendWelcomeEmail } = require("./emailService/send.email");

const port = process.env.PORT || 3000;

// Optional: connect to MongoDB if MONGO_URI is provided
if (process.env.MONGO_URI) {
  const uri = process.env.MONGO_URI;
  const valid = /^mongodb(\+srv)?:\/\//i.test(uri);
  if (!valid) {
    console.warn(
      "MONGO_URI looks invalid or is a placeholder. Skipping DB connect."
    );
  } else {
    mongoose
      .connect(uri)
      .then(() => console.log("Connected to MongoDB"))
      .catch((err) => console.error("MongoDB connection error:", err));
  }
}

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
