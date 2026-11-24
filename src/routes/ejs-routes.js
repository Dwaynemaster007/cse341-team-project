import { Router } from 'express';
import { homePage, aboutPage, testErrorPage } from './index.js';
import { trainsPage } from './trains.js';
import { listTripsPage, tripDetailsPage } from '../controllers/trips.js';

import {
  bookingPage,
  processBookingRequest,
  bookingsAdminPage
} from '../controllers/bookings.js';

import confirmationPage from './confirm.js';
import {
  registerPage,
  register,
  loginPage,
  login,
  logout,
  adminDashboardPage
} from '../controllers/auth.js';
import { requirePageRole } from '../middleware/auth.js';

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

// ===== FS1: Trips pages =====
router.get('/trips', listTripsPage);
router.get('/trips/:tripId', tripDetailsPage);

// ===== FS2: Schedules pages =====

// ===== FS3: Bookings pages =====
router.get('/trips/booking/:scheduleId', bookingPage);
router.post('/trips/book', processBookingRequest);
router.get('/trips/confirmation/:confirmationId', confirmationPage);
router.get('/bookings-admin', bookingsAdminPage);

// ===== FS4: Ticket Classes pages =====

// ===== FS5: Stations pages =====

// ===== Authentication (W04 FS1) =====
router.get('/register', registerPage);
router.post('/register', register);
router.get('/login', loginPage);
router.post('/login', login);
router.post('/logout', logout);

// ===== Admin pages (admin role required) =====
router.get('/admin', requirePageRole('admin'), adminDashboardPage);

export default router;
