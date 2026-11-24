import trips from './seeds/trips.json' with { type: 'json' };
import schedules from './seeds/schedules.json' with { type: 'json' };
import stations from './seeds/stations.json' with { type: 'json' };
import ticketClasses from './seeds/ticket-classes.json' with { type: 'json' };
import trains from './seeds/trains.json' with { type: 'json' };

const starterCollections = [
  ['trips', trips],
  ['schedules', schedules],
  ['stations', stations],
  ['ticketClasses', ticketClasses],
  ['trains', trains]
];

const ROLE_NAMES = ['customer', 'admin'];

/**
 * Adds the standard roles if they are missing. Safe to run any number of times:
 * it never deletes roles or users, so existing accounts keep their role references.
 */
const seedRoles = async (db) => {
  const roles = db.collection('roles');

  for (const name of ROLE_NAMES) {
    await roles.updateOne(
      { name },
      { $setOnInsert: { name, createdAt: new Date(), updatedAt: new Date() } },
      { upsert: true }
    );
  }
};

const initializeDatabase = async (db) => {
  if (!db) {
    throw new Error('A database connection is required to initialize data.');
  }

  for (const [collectionName, documents] of starterCollections) {
    const collection = db.collection(collectionName);
    await collection.deleteMany({});
    await collection.insertMany(documents);
  }

  const bookings = db.collection('bookings');
  await bookings.deleteMany({});
  await bookings.createIndex({ id: 1 }, { unique: true });

  // Users are intentionally NOT deleted here; only the roles they reference are ensured.
  await seedRoles(db);
};

export { initializeDatabase, seedRoles, starterCollections, ROLE_NAMES };
