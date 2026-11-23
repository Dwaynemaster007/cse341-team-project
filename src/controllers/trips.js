import {
    getTripById as findTripById,
    getAllTrips as findAllTrips
} from '../models/trips.js';
import { getDb } from '../db/connect.js';

/**
 * API: GET /api/trips
 * Returns every trip as JSON.
 */
const getAllTrips = async (req, res) => {
    try {
        const trips = await findAllTrips();
        return res.status(200).json(trips);
    } catch (error) {
        console.error('GET /api/trips failed:', error.message);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

/**
 * API: GET /api/trips/:id
 * Returns one trip by its custom id, or 404 when it does not exist.
 */
const getTripById = async (req, res) => {
    const requestedId = req.params.id;

    try {
        const trip = await findTripById(requestedId);

        if (!trip) {
            return res.status(404).json({ message: 'Trip not found' });
        }

        return res.status(200).json(trip);
    } catch (error) {
        console.error('GET /api/trips/:id failed:', error.message);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

/**
 * Page: GET /trips
 * Renders the page shell only; public/js/main.js fills it from /api/trips.
 */
const listTripsPage = (req, res) => {
    return res.render('trips/list', { title: 'Scenic Train Trips' });
};

/**
 * Page: GET /trips/:tripId
 * Renders the trip details page, or the site's 404 page when the trip does not exist.
 */
const tripDetailsPage = async (req, res, next) => {
    const { tripId } = req.params;

    try {
        const details = await findTripById(tripId);

        if (!details) {
            const notFound = new Error('Trip not found');
            notFound.status = 404;
            return next(notFound);
        }

        // Schedules still use the MongoDB driver until FS2 moves them to the schedules API.
        details.schedules = await getDb()
            .collection('schedules')
            .find({ tripId })
            .toArray();

        return res.render('trips/details', {
            title: 'Trip Details',
            details
        });
    } catch (error) {
        return next(error);
    }
};

export { getAllTrips, getTripById, listTripsPage, tripDetailsPage };
