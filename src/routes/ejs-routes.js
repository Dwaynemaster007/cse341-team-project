import { Router } from 'express';
import { homePage, aboutPage, testErrorPage } from './index.js';
import { trainsPage } from './trains.js';
import railTripsRouter from './trips.js';

import {
  bookingPage,
  processBookingRequest,
  bookingsAdminPage
} from '../controllers/bookings.js';

import confirmationPage from './confirm.js';

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
router.get('/trips/booking/:scheduleId', bookingPage);
router.post('/trips/book', processBookingRequest);
router.get('/trips/confirmation/:confirmationId', confirmationPage);
router.get('/bookings-admin', bookingsAdminPage);

// ===== FS4: Ticket Classes pages =====

// ===== FS5: Stations pages =====

export default router;
