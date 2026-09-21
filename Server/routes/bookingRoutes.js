const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');

router.post('/', bookingController.bookFlight);
router.get('/all', bookingController.getAllBookings);
router.get('/:userId', bookingController.getUserBookings);
router.delete('/:id', bookingController.cancelBooking);

module.exports = router;

