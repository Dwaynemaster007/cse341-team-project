import { Router } from 'express';
import { trainsApi } from './trains.js';
import { getAllTrips, getTripById } from '../controllers/trips.js';
import { getAllBookings as bookingsApi } from '../controllers/bookings.js';

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
 *     Pagination:
 *       type: object
 *       description: Describes which slice of the results was returned.
 *       properties:
 *         page:
 *           type: integer
 *           example: 1
 *         limit:
 *           type: integer
 *           example: 10
 *         totalItems:
 *           type: integer
 *           description: Number of records that match the query (not just this page)
 *           example: 14
 *         totalPages:
 *           type: integer
 *           example: 2
 *         hasNextPage:
 *           type: boolean
 *           example: true
 *         hasPreviousPage:
 *           type: boolean
 *           example: false
 *     ValidationError:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *           example: Invalid query parameters
 *         errors:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               field:
 *                 type: string
 *               message:
 *                 type: string
 *   parameters:
 *     PageParam:
 *       in: query
 *       name: page
 *       description: Page number to return (starts at 1)
 *       schema:
 *         type: integer
 *         minimum: 1
 *         default: 1
 *     LimitParam:
 *       in: query
 *       name: limit
 *       description: Number of records per page (maximum 50)
 *       schema:
 *         type: integer
 *         minimum: 1
 *         maximum: 50
 *         default: 10
 *     OrderParam:
 *       in: query
 *       name: order
 *       description: Sort direction
 *       schema:
 *         type: string
 *         enum: [asc, desc]
 *         default: asc
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
 *     summary: Search, filter and page through trips
 *     description: >
 *       Returns trips 10 at a time by default, sorted by name. Every filter is optional and
 *       filters can be combined. The pagination metadata counts only the trips that match.
 *     tags:
 *       - Trips
 *     parameters:
 *       - in: query
 *         name: q
 *         description: Keyword search. Case-insensitive match anywhere in the trip name or description (1-100 characters).
 *         schema:
 *           type: string
 *           maxLength: 100
 *           example: gorge
 *       - in: query
 *         name: region
 *         description: Only trips in this region. Allowed values are the regions that exist in the database.
 *         schema:
 *           type: string
 *           example: kansai
 *       - in: query
 *         name: season
 *         description: Only trips whose best season is this season.
 *         schema:
 *           type: string
 *           example: autumn
 *       - $ref: '#/components/parameters/PageParam'
 *       - $ref: '#/components/parameters/LimitParam'
 *       - in: query
 *         name: sort
 *         description: Field to sort by
 *         schema:
 *           type: string
 *           enum: [name, region, bestSeason, distance]
 *           default: name
 *       - $ref: '#/components/parameters/OrderParam'
 *     responses:
 *       200:
 *         description: One page of matching trips. No matches, or a page past the last one, returns an empty data array.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Trip'
 *                 pagination:
 *                   $ref: '#/components/schemas/Pagination'
 *                 query:
 *                   type: object
 *                   description: The search, filters and sort that were applied
 *                   properties:
 *                     q:
 *                       type: string
 *                       example: gorge
 *                     region:
 *                       type: string
 *                       example: kansai
 *                     season:
 *                       type: string
 *                       example: autumn
 *                     sort:
 *                       type: string
 *                       example: name
 *                     order:
 *                       type: string
 *                       example: asc
 *       400:
 *         description: Invalid q, region, season, page, limit, sort or order
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationError'
 *             example:
 *               message: Invalid query parameters
 *               errors:
 *                 - field: limit
 *                   message: limit must be a whole number between 1 and 50.
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
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *             example:
 *               error: Failed to fetch bookings
 */
router.get('/api/bookings', bookingsApi);
// ===== FS4: Ticket Classes API =====

// ===== FS5: Stations API =====

export default router;
