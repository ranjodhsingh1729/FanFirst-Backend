const mongoose = require("mongoose");
const { Schema } = mongoose;

const EventSchema = new Schema(
  {
    title: { type: String, required: true },
    date: { type: Date, required: true },
    venue: { type: String },
    artist: { type: String },
    description: { type: String },
    totalTickets: { type: Number, required: true },
    generalTickets: { type: Number, required: true },
    soldTickets: { type: Number, default: 0 },
    pricing: {
      priorityPrice: { type: Number },
      generalPrice: { type: Number },
    },
    salesOpen: { type: Boolean, default: false },
    location: {
      type: { type: String, default: "Point" },
      coordinates: { type: [Number], index: "2dsphere" },
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Event", EventSchema);
