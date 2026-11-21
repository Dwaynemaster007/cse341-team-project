import listTripsPage from './list.js';
import tripDetailsPage from './details.js';
import { Router } from 'express';

const router = Router();

// List all trips
router.get('/', listTripsPage);

// Trip details page
router.get('/:tripId', tripDetailsPage);

export default router;