import { closeDb, connectToDb } from './connect.js';
import { seedRoles, ROLE_NAMES } from './initialize.js';

/**
 * Adds the customer and admin roles to the database without touching any other data.
 * Usage: npm run db:roles
 */
try {
  const db = await connectToDb();
  await seedRoles(db);
  console.log(`Roles ready: ${ROLE_NAMES.join(', ')}`);
} finally {
  await closeDb();
}
