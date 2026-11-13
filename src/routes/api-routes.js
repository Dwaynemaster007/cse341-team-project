import { Router } from 'express';
import { trainsApi } from './trains.js';

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

// ===== FS4: Ticket Classes API =====

// ===== FS5: Stations API =====

export default router;
