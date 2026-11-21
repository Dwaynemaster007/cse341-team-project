import { closeDb, connectToDb } from './connect.js';
import { seedRoles } from './initialize.js';
import { setUserRole } from '../models/users.js';

/**
 * Promotes an existing user to the admin role. There is deliberately no web route
 * for this, so nobody can make themselves an admin from the browser.
 * Usage: npm run db:make-admin -- someone@example.com
 */
const email = process.argv[2];

if (!email) {
  console.error('Usage: npm run db:make-admin -- someone@example.com');
  process.exit(1);
}

try {
  const db = await connectToDb();
  await seedRoles(db);
  const user = await setUserRole(email, 'admin');

  if (!user) {
    console.error(`No user found with email ${email}. Register the account first.`);
    process.exitCode = 1;
  } else {
    console.log(`${user.email} is now an admin.`);
  }
} finally {
  await closeDb();
}
