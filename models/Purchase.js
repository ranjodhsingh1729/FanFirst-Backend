const mongoose = require("mongoose");
const { Schema } = mongoose;

const TicketSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User" },
    eventId: { type: Schema.Types.ObjectId, ref: "Event", required: true },
    type: { type: String, enum: ["priority", "general"], required: true },
    price: { type: Number, required: true },
    isRedeemed: { type: Boolean, default: false },
  },
  { timestamps: true },
);

const PurchaseSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    eventId: { type: Schema.Types.ObjectId, ref: "Event", required: true },
    tickets: [
      {
        ticket: TicketSchema,
        count: { type: Number, required: true, default: 1 },
      },
    ],
    totalAmount: { type: Number, required: true },
    currency: { type: String, default: "USD" },
    status: {
      type: String,
      enum: ["pending", "completed", "failed"],
      default: "pending",
    },
    transactionDate: { type: Date, default: Date.now },
    paymentReference: { type: String },
  },
  { timestamps: true },
);

module.exports = {
  Ticket: mongoose.model("Ticket", TicketSchema),
  Purchase: mongoose.model("Purchase", PurchaseSchema),
};
