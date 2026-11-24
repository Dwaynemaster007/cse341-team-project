import {
    getTripById as findTripById,
    getPaginatedTrips,
    getTripFilterOptions
} from '../models/trips.js';
import { getDb } from '../db/connect.js';
import { buildPagination, parsePagination } from '../includes/pagination.js';

// Clients may only sort by these fields (an allowlist), never by arbitrary database fields.
const TRIP_SORT_FIELDS = ['name', 'region', 'bestSeason', 'distance'];
const MAX_SEARCH_LENGTH = 100;

// Escapes characters that have a special meaning in regular expressions, so a search for
// "(" or ".*" is treated as plain text instead of breaking or widening the query.
const escapeRegex = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * Checks the region, season and q query parameters and builds the MongoDB filter from the
 * accepted values only (req.query is never passed to the database directly).
 */
const parseTripFilters = (query, { regions, seasons }) => {
    const errors = [];
    const filter = {};
    const applied = {};

    if (query.q !== undefined) {
        const searchText = typeof query.q === 'string' ? query.q.trim() : '';

        if (searchText.length < 1 || searchText.length > MAX_SEARCH_LENGTH) {
            errors.push({ field: 'q', message: `q must be a single search term between 1 and ${MAX_SEARCH_LENGTH} characters.` });
        } else {
            // Case-insensitive "contains" match on the trip name or description.
            const pattern = new RegExp(escapeRegex(searchText), 'i');
            filter.$or = [{ name: pattern }, { description: pattern }];
            applied.q = searchText;
        }
    }

    if (query.region !== undefined) {
        const region = typeof query.region === 'string' ? query.region.trim().toLowerCase() : '';

        if (!regions.includes(region)) {
            errors.push({ field: 'region', message: `region must be one of: ${regions.join(', ')}.` });
        } else {
            filter.region = region;
            applied.region = region;
        }
    }

    if (query.season !== undefined) {
        const season = typeof query.season === 'string' ? query.season.trim().toLowerCase() : '';

        if (!seasons.includes(season)) {
            errors.push({ field: 'season', message: `season must be one of: ${seasons.join(', ')}.` });
        } else {
            filter.bestSeason = season;
            applied.season = season;
        }
    }

    return { errors, filter, applied };
};

/**
 * API: GET /api/trips?q=gorge&region=kansai&season=autumn&page=1&limit=10&sort=name&order=asc
 * Returns one page of the trips that match the search and filters, with metadata describing
 * the page and the query that was applied. Every filter is optional.
 * Invalid query parameters return 400 with a list of every problem found.
 */
const getAllTrips = async (req, res) => {
    const pagination = parsePagination(req.query, {
        sortFields: TRIP_SORT_FIELDS,
        defaultSort: 'name'
    });

    try {
        const filterOptions = await getTripFilterOptions();
        const { errors: filterErrors, filter, applied } = parseTripFilters(req.query, filterOptions);
        const errors = [...filterErrors, ...pagination.errors];

        if (errors.length > 0) {
            return res.status(400).json({ message: 'Invalid query parameters', errors });
        }

        const { page, limit, sort, order } = pagination.options;
        const { trips, totalItems } = await getPaginatedTrips({
            filter,
            page,
            limit,
            sort,
            order: order === 'desc' ? -1 : 1
        });

        return res.status(200).json({
            data: trips,
            pagination: buildPagination({ page, limit, totalItems }),
            query: { ...applied, sort, order }
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
 * Renders the page shell and the region/season dropdown options;
 * public/js/trips-list.js loads the trips themselves from /api/trips.
 */
const listTripsPage = async (req, res, next) => {
    try {
        const { regions, seasons } = await getTripFilterOptions();

        return res.render('trips/list', {
            title: 'Scenic Train Trips',
            regions,
            seasons
        });
    } catch (error) {
        return next(error);
    }
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
