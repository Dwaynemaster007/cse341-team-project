import { Router } from 'express';
import { trainsApi } from './trains.js';
import { getAllBookings as bookingsApi } from '../controllers/bookings.js';
import {
  getAllTicketClasses,
  getTicketClassesForDay,
} from '../controllers/ticket-classes.js';

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
 *                 type: object
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
 *                 error:
 *                   type: string
 *                 validDays:
 *                   type: array
 *                   items:
 *                     type: string
 *       500:
 *         description: Failed to retrieve ticket classes
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 */
router.get('/api/ticket-classes', (req, res) => {
  if (req.query.day !== undefined) {
    return getTicketClassesForDay(req, res);
  }

  return getAllTicketClasses(req, res);
});

// ===== FS5: Stations API =====

export default router;
