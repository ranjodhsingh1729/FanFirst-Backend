// config/passport.js
const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const SpotifyStrategy = require("passport-spotify").Strategy;

require("dotenv").config();
const User = require("../models/User");

// serialize/deserialize user session
passport.serializeUser((user, done) => {
  done(null, user.id);
});
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err);
  }
});

// Local Strategy for signup/login
passport.use(
  new LocalStrategy(
    { usernameField: "email" },
    async (email, password, done) => {
      try {
        const user = await User.findOne({ email });
        if (!user) return done(null, false, { message: "Incorrect email." });
        const valid = await user.validatePassword(password);
        if (!valid)
          return done(null, false, { message: "Incorrect password." });
        return done(null, user);
      } catch (err) {
        return done(err);
      }
    },
  ),
);

// Spotify strategy for linking external account; note the use of 'passReqToCallback'
passport.use(
  "spotify-link",
  new SpotifyStrategy(
    {
      clientID: process.env.SPOTIFY_CLIENT_ID,
      clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
      callbackURL: process.env.SPOTIFY_CALLBACK_URL,
      passReqToCallback: true, // allows access to req.user in the verify callback
    },
    async (req, accessToken, refreshToken, expires_in, profile, done) => {
      try {
        // Ensure the user is authenticated on your platform
        const user = req.user;
        if (!user) return done(new Error("User not authenticated"), null);

        // Update the user's external account information
        user.externalAccounts.spotify = {
          id: profile.id,
          accessToken,
          refreshToken,
          profile: profile,
        };
        await user.save();
        return done(null, user);
      } catch (err) {
        return done(err);
      }
    },
  ),
);

module.exports = passport;
