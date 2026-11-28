
import { Router } from 'express';
import { trainsApi } from './trains.js';

import {
    getAllStations,
    getStationById,
} from '../controllers/stations.js';

import {
    getAllTrips,
    getTripById,
    updateTrip,
    deleteTrip
} from '../controllers/trips.js';

import { getAllBookings as bookingsApi } from '../controllers/bookings.js';

import {
    getAllTicketClasses,
    getTicketClassesForDay,
} from '../controllers/ticket-classes.js';

import { requireApiRole } from '../middleware/auth.js';

/**
 * Routes that expose JSON API endpoints.
 * Document every route with an @openapi comment directly above it;
 * Swagger at /api-docs is generated from this file when the app starts.
 * Each feature set adds its routes inside its own section below.
 */
const router = Router();

/**
 * @openapi
 * components:
 *   schemas:
 *     Message:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *     TicketClass:
 *       type: object
 *       properties:
 *         class:
 *           type: string
 *           example: standard
 *         name:
 *           type: string
 *           example: Standard Class
 *         pricePerKm:
 *           type: number
 *           example: 80
 *         availableDays:
 *           type: array
 *           items:
 *             type: string
 *             enum:
 *               - monday
 *               - tuesday
 *               - wednesday
 *               - thursday
 *               - friday
 *               - saturday
 *               - sunday
 *         amenities:
 *           type: array
 *           items:
 *             type: string
 *         description:
 *           type: string
 *   responses:
 *     ServerError:
 *       description: Unexpected server or database error
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Message'
 *           example:
 *             message: Internal server error
 */

// ===== Trains (existing example) =====

/**
 * @openapi
 * /api/trains:
 *   get:
 *     summary: Get all trains
 *     tags:
 *       - Trains
 *     responses:
 *       200:
 *         description: Trains returned successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 trains:
 *                   type: array
 *                   items:
 *                     type: object
 *             example:
 *               trains:
 *                 - id: series-e353
 *                   name: Series E353 Limited Express
 *                   operator: JR East
 *                   type: Limited Express
 *                   maxSpeedKmh: 130
 *                   capacity: 360
 *                   powerSource: Electric
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/api/trains', trainsApi);

// ===== FS1: Trips API =====

/**
 * @openapi
 * components:
 *   schemas:
 *     Trip:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: Custom trip id
 *           example: alpine-panorama
 *         name:
 *           type: string
 *           example: Alpine Panorama Express
 *         description:
 *           type: string
 *           example: Journey through the Japanese Alps with stunning mountain views and traditional villages.
 *         region:
 *           type: string
 *           example: central
 *         startStation:
 *           type: string
 *           description: Station id (see the stations collection)
 *           example: nagoya
 *         endStation:
 *           type: string
 *           example: toyama
 *         duration:
 *           type: string
 *           example: 4.5 hours
 *         distance:
 *           type: number
 *           description: Distance in kilometres
 *           example: 180
 *         highlights:
 *           type: array
 *           items:
 *             type: string
 *           example:
 *             - Mount Tateyama views
 *             - Hida River gorge
 *             - Traditional alpine villages
 *         bestSeason:
 *           type: string
 *           example: autumn
 *         operatingMonths:
 *           type: array
 *           items:
 *             type: integer
 *           example: [4, 5, 6, 7, 8, 9, 10, 11]
 *         imageUrl:
 *           type: string
 *           example: /images/routes/alpine-panorama.png
 */

/**
 * @openapi
 * /api/trips:
 *   get:
 *     summary: Get all trips
 *     tags:
 *       - Trips
 *     responses:
 *       200:
 *         description: Trips returned successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Trip'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/api/trips', getAllTrips);

/**
 * @openapi
 * /api/trips/{id}:
 *   get:
 *     summary: Get one trip by id
 *     tags:
 *       - Trips
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: The custom trip id, such as alpine-panorama
 *         schema:
 *           type: string
 *           example: alpine-panorama
 *     responses:
 *       200:
 *         description: Trip returned successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Trip'
 *       404:
 *         description: Trip not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Message'
 *             example:
 *               message: Trip not found
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/api/trips/:id', getTripById);

/**
 * @openapi
 * /api/trips/{id}:
 *   put:
 *     summary: Update a trip
 *     tags:
 *       - Trips
 *     security:
 *       - sessionCookie: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Trip'
 *     responses:
 *       200:
 *         description: Trip updated successfully
 *       400:
 *         description: Invalid trip data or schedule selection
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Admin role required
 *       404:
 *         description: Trip not found
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.put('/api/trips/:id', requireApiRole('admin'), updateTrip);

/**
 * @openapi
 * /api/trips/{id}:
 *   delete:
 *     summary: Delete a trip
 *     tags:
 *       - Trips
 *     security:
 *       - sessionCookie: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Trip deleted successfully
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Admin role required
 *       404:
 *         description: Trip not found
 *       409:
 *         description: Trip has associated schedules or bookings
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.delete('/api/trips/:id', requireApiRole('admin'), deleteTrip);

// ===== FS2: Schedules API =====

// ===== FS3: Bookings API =====

/**
 * @openapi
 * /api/bookings:
 *   get:
 *     summary: Get all bookings
 *     tags:
 *       - Bookings
 *     responses:
 *       200:
 *         description: Bookings returned successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *             example:
 *               - id: JRW6GCNMRM
 *                 createdAt: "2026-11-16T18:57:21.317Z"
 *                 scheduleId: "1"
 *                 tripId: alpine-panorama
 *                 ticketClass: standard
 *                 selectedDay: friday
 *                 passengers:
 *                   - firstName: Test
 *                     lastName: Testy
 *                     email: test@example.com
 *                     phone: "4799999999"
 *       500:
 *         description: Failed to retrieve bookings
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Message'
 *             example:
 *               message: Failed to fetch bookings
 */
router.get('/api/bookings', bookingsApi);

// ===== FS4: Ticket Classes API =====

/**
 * @openapi
 * /api/ticket-classes:
 *   get:
 *     summary: Get all ticket classes or filter by available weekday
 *     tags:
 *       - Ticket Classes
 *     parameters:
 *       - in: query
 *         name: day
 *         required: false
 *         schema:
 *           type: string
 *           enum:
 *             - monday
 *             - tuesday
 *             - wednesday
 *             - thursday
 *             - friday
 *             - saturday
 *             - sunday
 *         description: Filter ticket classes by available weekday
 *     responses:
 *       200:
 *         description: Ticket classes returned successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/TicketClass'
 *             example:
 *               - class: standard
 *                 name: Standard Class
 *                 pricePerKm: 80
 *                 availableDays:
 *                   - monday
 *                   - tuesday
 *                   - wednesday
 *       400:
 *         description: Invalid or missing weekday when filtering
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 validDays:
 *                   type: array
 *                   items:
 *                     type: string
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/api/ticket-classes', (req, res) => {
  if (req.query.day !== undefined) {
    return getTicketClassesForDay(req, res);
  }

  return getAllTicketClasses(req, res);
});

// ===== FS5: Stations API =====
/**
 * @openapi
 * /api/stations:
 *   get:
 *     summary: Get all stations
 *     tags:
 *       - Stations
 *     responses:
 *       200:
 *         description: Stations returned successfully
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get("/api/stations", getAllStations);

/**
 * @openapi
 * /api/stations/{id}:
 *   get:
 *     summary: Get a station by ID
 *     tags:
 *       - Stations
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Station returned successfully
 *       404:
 *         description: Station not found
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get("/api/stations/:id", getStationById);

export default router;
