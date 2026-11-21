import { getDb } from '../db/connect.js';
import { generateConfirmationCode } from '../includes/helpers.js';
import {
  getBookingById as findBookingById,
  getAllBookings as findAllBookings,
  createBooking
} from "../models/bookings.js";


export async function getBookingById(req, res) {
    try {
        const { id } = req.params;

        const booking = await findBookingById(id);

        if (!booking) {
            return res.status(404).json({
            error: "Booking not found",
            });
        }

    return res.status(200).json(booking);
    } catch (error) {
        console.error("Error fetching booking:", error);

        return res.status(500).json({
            error: "Failed to fetch booking",
        });
    }
}

export async function getAllBookings(req, res) {
    try {
        const bookings = await findAllBookings();

        return res.status(200).json(bookings);
    } catch (error) {
        console.error("Failed to retrieve bookings:", error);

        return res.status(500).json({
            error: "Failed to fetch bookings",
        });
    }
}

export function bookingsAdminPage(req, res) {
  res.render('bookings', {
    title: 'Bookings Admin'
  });
}

const bookingPage = async (req, res) => {
    const { scheduleId } = req.params;

    const db = getDb();
    const schedule = await db.collection('schedules').findOne({ id: Number(scheduleId) });
    const trip = await db.collection('trips').findOne({ id: schedule.tripId });
    const ticketClasses = await db.collection('ticketClasses').find({}).toArray();
    const ticketOptions = ticketClasses.map((ticketClass) => ({
        class: ticketClass.class,
        name: ticketClass.name,
        price: trip.distance * ticketClass.pricePerKm,
        amenities: ticketClass.amenities,
        description: ticketClass.description
    }));

    res.render('trips/book', {
        title: 'Book Trip',
        schedule,
        ticketOptions
    });
};

const processBookingRequest = async (req, res) => {
    try {
        const booking = {
            ...req.body,
            id: generateConfirmationCode(),
            createdAt: new Date().toISOString()
        };
        
        await createBooking(booking);

        return res.redirect(`/trips/confirmation/${booking.id}`);
    } catch (error) {
        console.error("Error creating booking:", error);

        return res.status(500).json({
            error: "Failed to create booking"
        });
    }
};

export { bookingPage, processBookingRequest };


