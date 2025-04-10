const express = require("express");
const router = express.Router({ mergeParams: true });

const { Ticket, Purchase } = require("../models/Purchase");
const Event = require("../models/Event");

// Add a purchase endpoint for a specific event
router.post("/", async (req, res) => {
  const { id } = req.params; // Use 'id' instead of 'eventId'
  const { tickets, totalAmount, currency, status, transactionDate, paymentReference } = req.body;

  // Extract userId from the authenticated session
  const userId = req.user?._id;
  if (!userId) {
    return res.status(401).json({ message: "User not authenticated" });
  }

  try {
    const event = await Event.findById(id);
    if (!event) return res.status(404).json({ message: "Event not found" });

    const ticketArray = [];

    // Validate tickets and create individual ticket documents
    for (const ticket of tickets) {
      if (event.generalTickets < ticket.count) {
        return res.status(400).json({ message: "Not enough tickets available" });
      }

      // Deduct the purchased tickets from the event
      event.generalTickets -= ticket.count;

      // Create ticket documents
      for (let i = 0; i < ticket.count; i++) {
        const newTicket = new Ticket({
          userId,
          eventId: id,
          type: ticket.ticket.type,
          price: ticket.ticket.price,
          isRedeemed: ticket.ticket.isRedeemed,
        });
        await newTicket.save();
        ticketArray.push(newTicket);
      }
    }
    await event.save();

    // Create a purchase record
    const purchase = new Purchase({
      userId,
      eventId: id,
      tickets: ticketArray.map((ticket) => ({ ticket, count: 1 })),
      totalAmount,
      currency,
      status,
      transactionDate,
      paymentReference,
    });
    await purchase.save();

    res.status(201).json({ message: "Purchase successful", purchase });
  } catch (err) {
    res.status(500).json({ message: "Error processing purchase", error: err.message });
  }
});

module.exports = router;
