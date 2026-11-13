import { Router } from 'express';
import { homePage, aboutPage, testErrorPage } from './index.js';
import { trainsPage } from './trains.js';
import railTripsRouter from './trips.js';

/**
 * Routes that render EJS pages.
 * Each feature set adds its page routes inside its own section below
 * to keep merge conflicts small.
 */
const router = Router();

// ===== General pages =====
router.get('/', homePage);
router.get('/about', aboutPage);
router.get('/trains', trainsPage);
router.get('/500', testErrorPage);

// ===== Legacy trip pages (FS1 Trips and FS3 Bookings move these into controllers) =====
router.use('/trips', railTripsRouter);

// ===== FS1: Trips pages =====

// ===== FS2: Schedules pages =====

// ===== FS3: Bookings pages =====

// ===== FS4: Ticket Classes pages =====

// ===== FS5: Stations pages =====

export default router;
