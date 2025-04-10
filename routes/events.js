const express = require("express");
const router = express.Router();
const Event = require("../models/Event");


// Get all events
router.get("/", async (req, res) => {
  try {
    const events = await Event.find();
    res.json(events);
  } catch (err) {
    res.status(500).json({ message: "Error fetching events" });
  }
});

// Get a specific event
router.get("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const event = await Event.findById(id);
    if (!event) return res.status(404).json({ message: "Event not found" });
    res.json(event);
  } catch (err) {
    res.status(500).json({ message: "Error fetching event details" });
  }
});

// Register the purchase route
const purchaseRoutes = require("./purchase");
router.use("/:id/purchase", purchaseRoutes);

// Create a new event
router.post("/", async (req, res) => {
  const {
    title,
    date,
    venue,
    artist,
    description,
    totalTickets,
    generalTickets,
    pricing,
    salesOpen,
    location
  } = req.body;
  try {
    const event = new Event({
      title,
      date,
      venue,
      artist,
      description,
      totalTickets,
      generalTickets,
      pricing,
      salesOpen,
      location
    });
    await event.save();
    res.status(201).json({ message: "Event created successfully", event });
  } catch (err) {
    res.status(500).json({ message: "Error creating event" });
  }
});


// Delete an event
router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const event = await Event.findByIdAndDelete(id);
    if (!event) return res.status(404).json({ message: "Event not found" });
    res.json({ message: "Event deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Error deleting event" });
  }
});

// // Update an event
// router.put("/:id", async (req, res) => {
//   const { id } = req.params;
//   const updateData = req.body;
//   try {
//     const event = await Event.findByIdAndUpdate(id, updateData, { new: true });
//     if (!event) return res.status(404).json({ message: "Event not found" });
//     res.json({ message: "Event updated successfully", event });
//   } catch (err) {
//     res.status(500).json({ message: "Error updating event" });
//   }
// });

module.exports = router;
