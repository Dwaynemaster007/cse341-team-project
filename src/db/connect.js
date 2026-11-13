import { MongoClient } from 'mongodb';
import mongoose from 'mongoose';

let database;
let client;

/**
 * Connects both the MongoDB driver (used by routes that have not been refactored yet)
 * and Mongoose (used by the new models in src/models). Both use the same connection
 * string and database name so they always read and write the same data.
 */
const connectToDb = async (options = {}) => {
  if (database) {
    return database;
  }

  const connectionString = options.connectionString || process.env.MONGODB_URI;
  const databaseName = options.databaseName || process.env.MONGODB_DB_NAME || 'practice';

  if (!connectionString) {
    throw new Error('MONGODB_URI is required.');
  }

  client = new MongoClient(connectionString);
  await client.connect();
  database = client.db(databaseName);

  await mongoose.connect(connectionString, { dbName: databaseName });

  return database;
};

const getDb = () => {
  if (!database) {
    throw new Error('Database not initialized. Call connectToDb first.');
  }
  return database;
};

const closeDb = async () => {
  await mongoose.disconnect();

  if (client) {
    await client.close();
    client = undefined;
    database = undefined;
  }
};

export { closeDb, connectToDb, getDb };
