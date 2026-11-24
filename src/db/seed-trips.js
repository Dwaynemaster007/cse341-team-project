import { closeDb, connectToDb } from './connect.js';
import trips from './seeds/trips.json' with { type: 'json' };

/**
 * Adds any starter trips that are missing from the database (matched by their custom id).
 * Insert-only: existing trips are never changed and nothing is deleted, so it is safe to run
 * against the shared team database.
 * Usage: npm run db:trips
 */
try {
  const db = await connectToDb();
  const collection = db.collection('trips');
  let added = 0;

  for (const trip of trips) {
    const now = new Date();
    const result = await collection.updateOne(
      { id: trip.id },
      { $setOnInsert: { ...trip, createdAt: now, updatedAt: now } },
      { upsert: true }
    );
    added += result.upsertedCount;
  }

  const total = await collection.countDocuments();
  console.log(`Trips ready: ${added} added, ${total} trips in the database.`);
} finally {
  await closeDb();
}
