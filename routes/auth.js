// routes/auth.js
const express = require("express");
const router = express.Router();
const passport = require("passport");
const rateLimit = require("express-rate-limit");
const { body, validationResult } = require("express-validator");

require("dotenv").config();
const User = require("../models/User");

// Rate limiter middleware
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Limit each IP to 100 requests per windowMs
  message: { message: "Too many requests, please try again later." },
});
router.use(limiter);

// Create a new user (Signup)
router.post(
  "/",
  [
    body("name").notEmpty().withMessage("name is required"),
    body("email").notEmpty().withMessage("email is required"),
    body("email").isEmail().withMessage("email is invalid"),
    body("password")
      .isLength({ min: 8 })
      .withMessage("Password must be at least 8 characters"),
  ],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, password } = req.body;
    try {
      const existingUser = await User.findOne({ email });
      if (existingUser)
        return res.status(400).json({ message: "User already exists" });

      const user = new User({ name, email, password });
      await user.save();

      req.login(user, (err) => {
        if (err) return next(err);

        res.status(201).json({ message: "User created", user });
      });
    } catch (err) {
      next(err);
    }
  },
);

// Login a user
router.post("/login", passport.authenticate("local"), (req, res) => {
  res.json({ message: "Logged in", user: req.user });
});

// Logout a user
router.get("/logout", (req, res, next) => {
  req.logout((err) => {
    if (err) return next(err);
    res.json({ message: "Logged out" });
  });
});

module.exports = router;
