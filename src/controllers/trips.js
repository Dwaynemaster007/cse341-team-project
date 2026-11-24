import {
    getTripById as findTripById,
    getPaginatedTrips
} from '../models/trips.js';
import { getDb } from '../db/connect.js';
import { buildPagination, parsePagination } from '../includes/pagination.js';

// Clients may only sort by these fields (an allowlist), never by arbitrary database fields.
const TRIP_SORT_FIELDS = ['name', 'region', 'bestSeason', 'distance'];

/**
 * API: GET /api/trips?page=1&limit=10&sort=name&order=asc
 * Returns one page of trips with pagination metadata.
 * Invalid query parameters return 400 with a list of every problem found.
 */
const getAllTrips = async (req, res) => {
    const { errors, options } = parsePagination(req.query, {
        sortFields: TRIP_SORT_FIELDS,
        defaultSort: 'name'
    });

    if (errors.length > 0) {
        return res.status(400).json({ message: 'Invalid query parameters', errors });
    }

    try {
        const { page, limit, sort, order } = options;
        const { trips, totalItems } = await getPaginatedTrips({
            page,
            limit,
            sort,
            order: order === 'desc' ? -1 : 1
        });

        return res.status(200).json({
            data: trips,
            pagination: buildPagination({ page, limit, totalItems }),
            query: { sort, order }
        });
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
