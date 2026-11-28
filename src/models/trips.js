import Trip from './schemas/trips.js';

export async function getTripById(id) {
    return Trip.findOne({ id }).lean();
}

export async function getAllTrips() {
    return Trip.find({}).lean();
}

/**
 * Updates an existing trip using its custom id.
 */
export async function updateTrip(id, tripData) {
    return Trip.findOneAndUpdate({ id }, { $set: tripData }, { returnDocument: 'after', runValidators: true }).lean();
}

/**
 * Deletes an existing trip using its custom id.
 */
export async function deleteTrip(id) {
    return Trip.findOneAndDelete({ id }).lean();
}
