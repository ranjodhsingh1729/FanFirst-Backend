const express = require('express');
const router = express.Router();
const User = require('../models/User'); // Assuming a User model exists
const Event = require('../models/Event'); // Assuming an Event model exists
const {Ticket, Purchase} = require('../models/Purchase'); // Assuming a Purchase model exists


// Apply authentication middleware to the route
router.get('/', async (req, res) => {
    try {
        if (!req.user || !req.user.id) {
            return res.status(401).json({ error: 'Unauthorized: User not authenticated' });
        }

        // Fetch user data
        const user = await User.findById(req.user.id).lean();

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Fetch user's purchases
        const purchases = await Purchase.find({ userId: user._id }).lean();

        // Fetch registered events
        const eventIds = purchases.map(purchase => purchase.eventId);
        const registeredEvents = await Event.find({ _id: { $in: eventIds } }).lean();

        // Construct response
        const response = {
            name: user.name,
            email: user.email,
            streamingAccounts: user.streamingAccounts || [], // Assuming streaming accounts are stored in the user model
            engagementScore: user.engagementScore || 0, // Assuming engagement score is stored in the user model
            ticketsPurchased: purchases.map(purchase => ({
                _id: purchase._id,
                eventId: purchase.eventId,
                type: purchase.type,
                price: purchase.price,
                purchaseDate: purchase.purchaseDate,
                isRedeemed: purchase.isRedeemed
            })),
            registeredEvents: registeredEvents.map(event => ({
                _id: event._id,
                title: event.title,
                date: event.date,
                venue: event.venue,
                artist: event.artist,
                description: event.description,
                totalTickets: event.totalTickets,
                generalTickets: event.generalTickets,
                pricing: event.pricing,
                salesOpen: event.salesOpen,
                location: event.location
            }))
        };

        res.status(200).json(response);
    } catch (error) {
        console.error('Error fetching dashboard data:', error);
        res.status(500).json({ error: 'Failed to fetch dashboard data' });
    }
});

module.exports = router;