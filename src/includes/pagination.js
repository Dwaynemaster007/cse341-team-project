/**
 * Shared helpers for paginated list endpoints.
 * Query parameters arrive as strings (or arrays when a key is repeated), so every value is
 * checked here before it is used in a database query.
 */

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 50;
const SORT_ORDERS = ['asc', 'desc'];

/**
 * Returns a whole number of at least 1, the default when the value was not sent,
 * or null when the value is invalid (e.g. "abc", "0", "-5", "1.5", or a repeated key).
 */
const parsePositiveInteger = (value, defaultValue) => {
    if (value === undefined) {
        return defaultValue;
    }

    if (typeof value !== 'string' || !/^\d+$/.test(value)) {
        return null;
    }

    const parsed = Number(value);
    return parsed >= 1 ? parsed : null;
};

/**
 * Validates page, limit, sort and order.
 * @param {object} query - req.query
 * @param {object} options
 * @param {string[]} options.sortFields - fields clients are allowed to sort by (an allowlist)
 * @param {string} options.defaultSort - field used when sort is not sent
 * @returns {{ errors: {field: string, message: string}[], options: {page: number, limit: number, sort: string, order: string} }}
 */
const parsePagination = (query, { sortFields, defaultSort }) => {
    const errors = [];

    const page = parsePositiveInteger(query.page, DEFAULT_PAGE);
    if (page === null) {
        errors.push({ field: 'page', message: 'page must be a whole number of 1 or more.' });
    }

    const limit = parsePositiveInteger(query.limit, DEFAULT_LIMIT);
    if (limit === null || limit > MAX_LIMIT) {
        errors.push({ field: 'limit', message: `limit must be a whole number between 1 and ${MAX_LIMIT}.` });
    }

    const sort = query.sort ?? defaultSort;
    if (!sortFields.includes(sort)) {
        errors.push({ field: 'sort', message: `sort must be one of: ${sortFields.join(', ')}.` });
    }

    const order = query.order ?? 'asc';
    if (!SORT_ORDERS.includes(order)) {
        errors.push({ field: 'order', message: 'order must be asc or desc.' });
    }

    return { errors, options: { page, limit, sort, order } };
};

/**
 * Builds the pagination metadata that is returned with every page of results.
 */
const buildPagination = ({ page, limit, totalItems }) => {
    const totalPages = Math.ceil(totalItems / limit);

    return {
        page,
        limit,
        totalItems,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1
    };
};

export { parsePagination, buildPagination, DEFAULT_LIMIT, MAX_LIMIT };
