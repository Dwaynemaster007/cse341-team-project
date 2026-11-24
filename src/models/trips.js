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

// Seasons are listed in calendar order rather than alphabetically.
const SEASON_ORDER = ['spring', 'summer', 'autumn', 'winter'];

const bySeason = (a, b) => {
    const rank = (season) => {
        const index = SEASON_ORDER.indexOf(season);
        return index === -1 ? SEASON_ORDER.length : index;
    };
    return rank(a) - rank(b) || a.localeCompare(b);
};

/**
 * Returns the regions and seasons that currently exist in the trips collection.
 * Used to build the filter dropdowns and to validate the region and season query parameters,
 * so a new region added by a trip admin works without a code change.
 */
export async function getTripFilterOptions() {
    const [regions, seasons] = await Promise.all([
        Trip.distinct('region'),
        Trip.distinct('bestSeason')
    ]);

    return {
        regions: regions.sort(),
        seasons: seasons.sort(bySeason)
    };
}
