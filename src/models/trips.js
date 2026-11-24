import Trip from './schemas/trips.js';

export async function getTripById(id) {
    return Trip.findOne({ id }).lean();
}

export async function getAllTrips() {
    return Trip.find({}).lean();
}

/**
 * Returns one page of trips plus the total number of trips that match the filter.
 * The controller validates every option before calling this function.
 * `id` is added as a tie-breaker so trips with the same sort value always come back in the
 * same order, which stops a trip from appearing on two pages (or on none).
 */
export async function getPaginatedTrips({ filter = {}, page, limit, sort, order }) {
    const skip = (page - 1) * limit;
    const sortOptions = { [sort]: order, id: 1 };

    const [trips, totalItems] = await Promise.all([
        Trip.find(filter).sort(sortOptions).skip(skip).limit(limit).lean(),
        Trip.countDocuments(filter)
    ]);

    return { trips, totalItems };
}
