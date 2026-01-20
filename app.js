const express = require("express");
const session = require("express-session");
const passport = require("passport");
const dotenv = require("dotenv");
const morgan = require("morgan");
const cors = require("cors");
const path = require('path')
const app = express();
// Serve userdoc folder as static files
app.use('/userdoc', express.static(path.join(__dirname, 'userdoc')));
// Load env
dotenv.config();

// Allow ALL origins (least secure - for development only)
app.use(cors());

// Or with specific options
app.use(
  cors({
    origin: "*", // Allow all origins
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "Accept"],
    credentials: false, // Set to true if using cookies/auth headers
  })
);

// Request logging
app.use(morgan(process.env.MORGAN_FORMAT || "dev"));

app.use(express.json());

// Sessions (required for passport persistent login)
app.use(
  session({
    secret: process.env.SESSION_SECRET || "keyboard cat",
    resave: false,
    saveUninitialized: false,
  })
);

// Initialize passport
require("./config/passport")(process.env);
app.use(passport.initialize());
app.use(passport.session());

// Routes
const helloRouter = require("./routes/hello");
app.use("/hello", helloRouter);

const authRouter = require("./routes/auth");
app.use("/auth", authRouter);

// Protected API routes (require authentication)
const { ensureAuth } = require("./middleware/auth");
const protectedRouter = require("./routes/protected");
app.use("/api", protectedRouter);

// Root
app.get("/", (req, res) => res.send("API is running"));
const ImgRoutes = require("./routes/image.routes");
app.use("/img", ImgRoutes);
module.exports = app;
