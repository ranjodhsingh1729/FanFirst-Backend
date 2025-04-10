// models/User.js
const bcrypt = require("bcrypt");
const mongoose = require("mongoose");
const { Schema } = mongoose;

const StreamingAccountSchema = new Schema({
  provider: {
    type: String,
    enum: ["Spotify", "AppleMusic", "YouTube"],
    required: true,
  },
  accountId: { type: String, required: true },
  accessToken: { type: String },
  refreshToken: { type: String },
  lastSynced: { type: Date },
  expiresIn: { type: Number },
  scope: { type: String },
});

const UserSchema = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, unique: true, required: true },
    password: { type: String, required: true },
    streamingAccounts: [StreamingAccountSchema],
    engagementScore: { type: Number, default: 0 },
    ticketsPurchased: [{ type: Schema.Types.ObjectId, ref: "Ticket" }],
    isVerified: { type: Boolean, default: false },
    location: {
      type: { type: String, default: "Point" },
      coordinates: [Number],
    },
  },
  { timestamps: true },
);

UserSchema.pre("save", async function (next) {
  if (this.isModified("password")) {
    this.password = await bcrypt.hash(this.password, 10);
  }
  next();
});

UserSchema.methods.validatePassword = function (password) {
  return bcrypt.compare(password, this.password);
};

module.exports = mongoose.model("User", UserSchema);
