import {
    getTripById as findTripById,
    getAllTrips as findAllTrips,
    updateTrip as updateTripModel,
    deleteTrip as deleteTripModel
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
 * API: PUT /api/trips/:id
 * Updates a trip and optionally reassigns existing schedules.
 */

const updateTrip = async (req, res) => {
    const { id } = req.params;

    const {
        name,
        description,
        region,
        startStation,
        endStation,
        duration,
        distance,
        highlights,
        bestSeason,
        operatingMonths,
        imageUrl,
        scheduleIds
    } = req.body;

    try {
        const db = getDb();

        // Check whether the trip exists.
        const existingTrip = await findTripById(id);

        if (!existingTrip) {
            return res.status(404).json({ message: 'Trip not found' });
        }

        // Validate the selected stations.
        const stations = db.collection('stations');

        const nextStartStation = startStation ?? existingTrip.startStation;
        const nextEndStation = endStation ?? existingTrip.endStation;

        const startStationExists = await stations.findOne({
            id: nextStartStation
        });

        const endStationExists = await stations.findOne({
            id: nextEndStation
        });

        if (!startStationExists || !endStationExists) {
            return res.status(400).json({
                message: 'Selected stations must exist'
            });
        }

        if (nextStartStation === nextEndStation) {
            return res.status(400).json({
                message: 'Start and end stations must be different'
            });
        }

        // Validate the selected schedules.
        let normalizedScheduleIds = [];

        if (scheduleIds !== undefined) {
            if (!Array.isArray(scheduleIds)) {
                return res.status(400).json({
                    message: 'scheduleIds must be an array'
                });
            }

            normalizedScheduleIds = scheduleIds.map(Number);

            if (
                normalizedScheduleIds.some(
                    (scheduleId) => !Number.isInteger(scheduleId) || scheduleId <= 0
                ) ||
                new Set(normalizedScheduleIds).size !== normalizedScheduleIds.length
            ) {
                return res.status(400).json({
                    message: 'Schedule IDs must be valid, unique positive integers'
                });
            }

            const schedules = db.collection('schedules');
            const bookings = db.collection('bookings');

            const selectedSchedules = await schedules.find({
                id: { $in: normalizedScheduleIds }
            }).toArray();

            if (selectedSchedules.length !== normalizedScheduleIds.length) {
                return res.status(400).json({
                    message: 'One or more selected schedules do not exist'
                });
            }

            for (const schedule of selectedSchedules) {
                // Check whether the schedule belongs to another trip.
                if (schedule.tripId && schedule.tripId !== id) {

                    // Check whether the schedule already has bookings.
                    const hasBookings = await bookings.findOne({
                        scheduleId: String(schedule.id)
                    });

                    if (hasBookings) {
                        return res.status(400).json({
                            message: 'A schedule with existing bookings cannot be reassigned'
                        });
                    }
                }
            }
        }

        // Only update fields that belong to the Trip model.
        const tripData = {
            name,
            description,
            region,
            startStation,
            endStation,
            duration,
            distance,
            highlights,
            bestSeason,
            operatingMonths,
            imageUrl
        };

        Object.keys(tripData).forEach((key) => {
            if (tripData[key] === undefined) {
                delete tripData[key];
            }
        });

        // Update the trip after all validations pass.
        const updatedTrip = await updateTripModel(id, tripData);

        if (!updatedTrip) {
            return res.status(404).json({ message: 'Trip not found' });
        }

        // Reassign selected schedules to this trip.
        if (scheduleIds !== undefined && normalizedScheduleIds.length > 0) {
            const schedules = db.collection('schedules');

            await schedules.updateMany(
                { id: { $in: normalizedScheduleIds } },
                { $set: { tripId: id } }
            );
        }

        return res.status(200).json({
            message: 'Trip updated successfully',
            trip: updatedTrip
        });
    } catch (error) {
        console.error('PUT /api/trips/:id failed:', error.message);

        return res.status(500).json({
            message: 'Internal server error'
        });
    }
};

/**
 * API: DELETE /api/trips/:id
 * Deletes a trip only when it has no associated schedules or bookings.
 */
const deleteTrip = async (req, res) => {
    const { id } = req.params;

    try {
        const db = getDb();

        // Check whether the trip exists.
        const existingTrip = await findTripById(id);

        if (!existingTrip) {
            return res.status(404).json({
                message: 'Trip not found'
            });
        }

        // Prevent deleting trips that still have schedules.
        const schedule = await db.collection('schedules').findOne({
            tripId: id
        });

        if (schedule) {
            return res.status(409).json({
                message: 'Cannot delete a trip that has associated schedules'
            });
        }

        // Additional protection against orphaned bookings.
        const booking = await db.collection('bookings').findOne({
            tripId: id
        });

        if (booking) {
            return res.status(409).json({
                message: 'Cannot delete a trip that has associated bookings'
            });
        }

        await deleteTripModel(id);

        return res.status(200).json({
            message: 'Trip deleted successfully'
        });
    } catch (error) {
        console.error('DELETE /api/trips/:id failed:', error.message);

        return res.status(500).json({
            message: 'Internal server error'
        });
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

/**
 * Page: GET /admin/trips
 * Renders the admin page for managing trips.
 * Trips will be loaded dynamically from the API using client-side JavaScript.
 */

const tripsAdminPage = async (req, res, next) => {
    try {
        const db = getDb();

        const [stations, schedules, bookedScheduleIds] = await Promise.all([
            db.collection('stations').find({}).toArray(),
            db.collection('schedules').find({}).toArray(),
            db.collection('bookings').distinct('scheduleId')
        ]);

        return res.render('admin/trips', {
            title: 'Manage Trips',
            stations,
            schedules,
            bookedScheduleIds
        });
    } catch (error) {
        return next(error);
    }
};

export { getAllTrips, getTripById, updateTrip, deleteTrip, listTripsPage, tripDetailsPage, tripsAdminPage, };
