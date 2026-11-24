/**
 * Trip list page (/trips).
 * Loads one page of trips at a time from /api/trips and renders the trip cards and the
 * pagination controls. The search, filters and page are kept in the URL
 * (?q=gorge&region=kansai&page=2), so refreshing or sharing the link shows the same results,
 * and the browser Back button steps back through earlier searches and pages.
 */
const initTripsList = () => {
    const PAGE_SIZE = 10;

    const listEl = document.getElementById('trips-list');
    const templateEl = document.getElementById('trip-card-template');
    const loadingEl = document.getElementById('trips-loading');
    const errorEl = document.getElementById('trips-error');
    const emptyEl = document.getElementById('trips-empty');
    const summaryEl = document.getElementById('trips-summary');
    const paginationEl = document.getElementById('trips-pagination');
    const prevButton = document.getElementById('trips-prev');
    const nextButton = document.getElementById('trips-next');
    const pageStatusEl = document.getElementById('trips-page-status');
    const filtersForm = document.getElementById('trips-filters');
    const searchInput = document.getElementById('trip-search');
    const regionSelect = document.getElementById('region-filter');
    const seasonSelect = document.getElementById('season-filter');
    const clearButton = document.getElementById('trips-clear');

    if (!listEl || !templateEl || !paginationEl || !filtersForm) {
        return;
    }

    const FILTER_KEYS = ['q', 'region', 'season'];

    // The current search: { page, q, region, season }. Empty filters are left out.
    let state = { page: 1 };
    // Each request gets a number; responses from older requests are ignored, so clicking
    // Next quickly can never show an older page on top of a newer one.
    let latestRequest = 0;

    const readStateFromUrl = () => {
        const params = new URLSearchParams(window.location.search);
        const page = Number(params.get('page'));
        const next = { page: Number.isInteger(page) && page >= 1 ? page : 1 };

        FILTER_KEYS.forEach((key) => {
            const value = (params.get(key) || '').trim();
            if (value) {
                next[key] = value;
            }
        });

        return next;
    };

    const writeStateToUrl = (addHistoryEntry) => {
        const url = new URL(window.location.href);
        url.search = '';

        FILTER_KEYS.forEach((key) => {
            if (state[key]) {
                url.searchParams.set(key, state[key]);
            }
        });

        if (state.page > 1) {
            url.searchParams.set('page', state.page);
        }

        if (addHistoryEntry) {
            window.history.pushState({}, '', url);
        } else {
            window.history.replaceState({}, '', url);
        }
    };

    // Keeps the search box and dropdowns in step with the current search.
    const showStateInForm = () => {
        searchInput.value = state.q || '';
        regionSelect.value = state.region || '';
        seasonSelect.value = state.season || '';
    };

    // Reads the form into a new search, starting again at page 1.
    const readStateFromForm = () => {
        const next = { page: 1 };
        const q = searchInput.value.trim();

        if (q) {
            next.q = q;
        }
        if (regionSelect.value) {
            next.region = regionSelect.value;
        }
        if (seasonSelect.value) {
            next.season = seasonSelect.value;
        }

        return next;
    };

    const createTripCard = (trip) => {
        const card = templateEl.content.cloneNode(true);

        card.querySelector('.route-card').classList.add(trip.region);
        card.querySelector('[data-field="name"]').textContent = trip.name;
        card.querySelector('[data-field="region"]').textContent = trip.region;
        card.querySelector('[data-field="start-station"]').textContent = trip.startStation;
        card.querySelector('[data-field="end-station"]').textContent = trip.endStation;
        card.querySelector('[data-field="duration"]').textContent = trip.duration;
        card.querySelector('[data-field="distance"]').textContent = trip.distance;

        const seasonEl = card.querySelector('[data-field="season"]');
        seasonEl.textContent = `Best in ${trip.bestSeason}`;
        seasonEl.classList.add(`season-${trip.bestSeason}`);

        card.querySelector('[data-field="description"]').textContent = trip.description;

        const highlightsEl = card.querySelector('[data-field="highlights"]');
        trip.highlights.forEach((highlight) => {
            const tag = document.createElement('span');
            tag.classList.add('highlight-tag');
            tag.textContent = highlight;
            highlightsEl.appendChild(tag);
        });

        card.querySelector('[data-field="details-link"]').href =
            `/trips/${encodeURIComponent(trip.id)}`;

        return card;
    };

    const renderPagination = ({ page, limit, totalItems, totalPages, hasNextPage, hasPreviousPage }) => {
        if (totalItems === 0) {
            summaryEl.textContent = '';
            paginationEl.hidden = true;
            return;
        }

        const first = (page - 1) * limit + 1;
        const last = Math.min(page * limit, totalItems);
        const isFiltered = FILTER_KEYS.some((key) => state[key]);
        const noun = isFiltered ? 'matching trips' : 'trips';
        summaryEl.textContent = `Showing ${first}–${last} of ${totalItems} ${noun}`;

        pageStatusEl.textContent = `Page ${page} of ${totalPages}`;
        prevButton.disabled = !hasPreviousPage;
        nextButton.disabled = !hasNextPage;
        paginationEl.hidden = totalPages <= 1;
    };

    const showError = (message) => {
        listEl.replaceChildren();
        emptyEl.hidden = true;
        paginationEl.hidden = true;
        summaryEl.textContent = '';
        errorEl.hidden = false;
        errorEl.textContent = message;
    };

    const loadTrips = async (nextState, { addHistoryEntry = false } = {}) => {
        const requestNumber = ++latestRequest;
        state = nextState;
        showStateInForm();

        loadingEl.hidden = false;
        errorEl.hidden = true;
        prevButton.disabled = true;
        nextButton.disabled = true;

        try {
            const params = new URLSearchParams({ page: state.page, limit: PAGE_SIZE });
            FILTER_KEYS.forEach((key) => {
                if (state[key]) {
                    params.set(key, state[key]);
                }
            });

            const response = await fetch(`/api/trips?${params}`);
            const body = await response.json();

            if (requestNumber !== latestRequest) {
                return;
            }

            if (response.status === 400) {
                // e.g. a hand-edited link with ?region=mars: explain what was wrong.
                writeStateToUrl(addHistoryEntry);
                showError(body.errors.map((error) => error.message).join(' '));
                return;
            }

            if (!response.ok) {
                throw new Error(`Failed to load trips (${response.status})`);
            }

            const { data, pagination } = body;

            // An old link such as ?page=9 goes to the last page that exists instead of a blank list.
            if (data.length === 0 && pagination.totalPages > 0 && state.page > pagination.totalPages) {
                await loadTrips({ ...state, page: pagination.totalPages });
                return;
            }

            writeStateToUrl(addHistoryEntry);

            const fragment = document.createDocumentFragment();
            data.forEach((trip) => fragment.appendChild(createTripCard(trip)));
            listEl.replaceChildren(fragment);

            emptyEl.hidden = data.length > 0;
            renderPagination(pagination);
        } catch (error) {
            if (requestNumber !== latestRequest) {
                return;
            }

            console.error('Error loading trips:', error);
            showError('Unable to load trips right now. Please try again in a moment.');
        } finally {
            if (requestNumber === latestRequest) {
                loadingEl.hidden = true;
            }
        }
    };

    const goToPage = async (page) => {
        await loadTrips({ ...state, page }, { addHistoryEntry: true });
        summaryEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    // A new search or filter always starts again at page 1.
    filtersForm.addEventListener('submit', (event) => {
        event.preventDefault();
        loadTrips(readStateFromForm(), { addHistoryEntry: true });
    });

    regionSelect.addEventListener('change', () => {
        loadTrips(readStateFromForm(), { addHistoryEntry: true });
    });

    seasonSelect.addEventListener('change', () => {
        loadTrips(readStateFromForm(), { addHistoryEntry: true });
    });

    clearButton.addEventListener('click', () => {
        loadTrips({ page: 1 }, { addHistoryEntry: true });
    });

    prevButton.addEventListener('click', () => goToPage(state.page - 1));
    nextButton.addEventListener('click', () => goToPage(state.page + 1));
    window.addEventListener('popstate', () => loadTrips(readStateFromUrl()));

    loadTrips(readStateFromUrl());
};

initTripsList();
