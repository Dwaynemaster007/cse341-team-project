/**
 * Trip list page (/trips).
 * Loads one page of trips at a time from /api/trips and renders the trip cards and the
 * pagination controls. The current page is kept in the URL (?page=2), so refreshing or sharing
 * the link opens the same page, and the browser Back button steps back through pages.
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

    if (!listEl || !templateEl || !paginationEl) {
        return;
    }

    let currentPage = 1;
    // Each request gets a number; responses from older requests are ignored, so clicking
    // Next quickly can never show an older page on top of a newer one.
    let latestRequest = 0;

    const readPageFromUrl = () => {
        const page = Number(new URLSearchParams(window.location.search).get('page'));
        return Number.isInteger(page) && page >= 1 ? page : 1;
    };

    const writePageToUrl = (page, addHistoryEntry) => {
        const url = new URL(window.location.href);

        if (page > 1) {
            url.searchParams.set('page', page);
        } else {
            url.searchParams.delete('page');
        }

        if (addHistoryEntry) {
            window.history.pushState({}, '', url);
        } else {
            window.history.replaceState({}, '', url);
        }
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
        summaryEl.textContent = `Showing ${first}–${last} of ${totalItems} trips`;

        pageStatusEl.textContent = `Page ${page} of ${totalPages}`;
        prevButton.disabled = !hasPreviousPage;
        nextButton.disabled = !hasNextPage;
        paginationEl.hidden = totalPages <= 1;
    };

    const loadTrips = async (page, { addHistoryEntry = false } = {}) => {
        const requestNumber = ++latestRequest;

        loadingEl.hidden = false;
        errorEl.hidden = true;
        prevButton.disabled = true;
        nextButton.disabled = true;

        try {
            const params = new URLSearchParams({ page, limit: PAGE_SIZE });
            const response = await fetch(`/api/trips?${params}`);

            if (!response.ok) {
                throw new Error(`Failed to load trips (${response.status})`);
            }

            const { data, pagination } = await response.json();

            if (requestNumber !== latestRequest) {
                return;
            }

            // An old link such as ?page=9 goes to the last page that exists instead of a blank list.
            if (data.length === 0 && pagination.totalPages > 0 && page > pagination.totalPages) {
                await loadTrips(pagination.totalPages);
                return;
            }

            currentPage = pagination.page;
            writePageToUrl(currentPage, addHistoryEntry);

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
            listEl.replaceChildren();
            paginationEl.hidden = true;
            summaryEl.textContent = '';
            errorEl.hidden = false;
            errorEl.textContent = 'Unable to load trips right now. Please try again in a moment.';
        } finally {
            if (requestNumber === latestRequest) {
                loadingEl.hidden = true;
            }
        }
    };

    const goToPage = async (page) => {
        await loadTrips(page, { addHistoryEntry: true });
        summaryEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    prevButton.addEventListener('click', () => goToPage(currentPage - 1));
    nextButton.addEventListener('click', () => goToPage(currentPage + 1));
    window.addEventListener('popstate', () => loadTrips(readPageFromUrl()));

    loadTrips(readPageFromUrl());
};

initTripsList();
