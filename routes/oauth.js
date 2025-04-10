// routes/connect.js
const express = require("express");
const router = express.Router();
const passport = require("passport");

// Middleware to ensure the user is logged in
function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) return next();
  res.status(401).json({ message: "Not authenticated" });
}

// Link Spotify account
router.post(
  "/spotify",
  ensureAuthenticated,
  passport.authenticate("spotify-link", {
    scope: ["user-read-email", "user-read-private"],
  }),
);

// Callback for Spotify linking
router.get(
  "/spotify/callback",
  ensureAuthenticated,
  passport.authenticate("spotify-link", { failureRedirect: "/profile" }),
  (req, res) => {
    res.json({ message: "Spotify account linked", user: req.user });
  },
);

// Link Apple Music account
router.post(
  "/apple-music",
  ensureAuthenticated,
  passport.authenticate("apple-music-link"),
);

router.get(
  "/apple-music/callback",
  ensureAuthenticated,
  passport.authenticate("apple-music-link", { failureRedirect: "/" }),
  (req, res) => {
    res.json({ message: "Apple Music account linked", user: req.user });
  },
);

// Link YouTube Music account
router.post(
  "/youtube-music",
  ensureAuthenticated,
  passport.authenticate("youtube-music-link", {
    scope: ["https://www.googleapis.com/auth/youtube.readonly"],
  }),
);

router.get(
  "/youtube-music/callback",
  ensureAuthenticated,
  passport.authenticate("youtube-music-link", { failureRedirect: "/" }),
  (req, res) => {
    res.json({ message: "YouTube Music account linked", user: req.user });
  },
);

module.exports = router;
