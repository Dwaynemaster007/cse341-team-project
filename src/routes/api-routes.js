import { Router } from 'express';
import { trainsApi } from './trains.js';
import { getAllTrips, getTripById } from '../controllers/trips.js';

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
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                   name:
 *                     type: string
 *                   region:
 *                     type: string
 *                   startStation:
 *                     type: string
 *                   endStation:
 *                     type: string
 *                   duration:
 *                     type: string
 *                   distance:
 *                     type: number
 *                   bestSeason:
 *                     type: string
 *             example:
 *               - id: alpine-panorama
 *                 name: Alpine Panorama
 *                 region: Alps
 *                 startStation: Zurich
 *                 endStation: Zermatt
 *                 duration: 8 hours
 *                 distance: 300
 *                 bestSeason: Summer
 *       500:
 *         description: Failed to fetch trips
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 */
router.get('/api/trips', getAllTrips);

/**
 * @openapi
 * /api/trips/{id}:
 *   get:
 *     summary: Get a trip by ID
 *     tags:
 *       - Trips
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Unique ID of the trip
 *     responses:
 *       200:
 *         description: Trip returned successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 name:
 *                   type: string
 *                 description:
 *                   type: string
 *                 region:
 *                   type: string
 *                 startStation:
 *                   type: string
 *                 endStation:
 *                   type: string
 *                 duration:
 *                   type: string
 *                 distance:
 *                   type: number
 *                 highlights:
 *                   type: array
 *                   items:
 *                     type: string
 *                 bestSeason:
 *                   type: string
 *                 operatingMonths:
 *                   type: array
 *                   items:
 *                     type: number
 *                 imageUrl:
 *                   type: string
 *       404:
 *         description: Trip not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *       500:
 *         description: Failed to fetch trip
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 */
router.get('/api/trips/:id', getTripById);

// ===== FS2: Schedules API =====

// ===== FS3: Bookings API =====

// ===== FS4: Ticket Classes API =====

// ===== FS5: Stations API =====

export default router;
