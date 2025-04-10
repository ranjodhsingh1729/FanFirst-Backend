// server.js
const cors = require("cors");
const express = require("express");
const session = require("express-session");
const mongoose = require("mongoose");

require("dotenv").config();
const passport = require("./config/passport");

const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;
if (!SPOTIFY_CLIENT_ID || !SPOTIFY_CLIENT_SECRET) {
  console.error(
    "Error: Missing Spotify API credentials in environment variables.",
  );
  process.exit(1);
}

// Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error(err));

// main app obeject
const app = express();
// Enable CORS for development;
app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  }),
);

// Middleware
app.use(express.json());
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
  }),
);
app.use(passport.initialize());
app.use(passport.session());

// Define routes
const authRoutes = require("./routes/auth");
const oauthRoutes = require("./routes/oauth");
const eventsRouter = require("./routes/events");
const dashboardRouter = require("./routes/dashboard");
app.use("/auth", authRoutes);
app.use("/oauth", oauthRoutes);
app.use("/events", eventsRouter);
app.use("/dashboard", dashboardRouter);

// Root Endpoint
app.get("/", (req, res) => {
  if (req.isAuthenticated()) {
    res.json({ message: `Hello ${req.user.displayName}`, user: req.user });
  } else {
    res.json({ message: "Welcome. Please log in." });
  }
});

// Centralized error-handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res
    .status(err.status || 500)
    .json({ message: err.message || "Internal Server Error" });
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
