import { Router } from 'express';
import apiRoutes from './api-routes.js';
import ejsRoutes from './ejs-routes.js';

/**
 * Main router: combines the JSON API routes and the EJS page routes.
 * Add new routes to api-routes.js or ejs-routes.js, not here.
 */
const router = Router();

router.use('/', apiRoutes);
router.use('/', ejsRoutes);

export default router;
