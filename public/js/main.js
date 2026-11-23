const hookRegionSorter = () => {
    const regionSelect = document.getElementById('region-filter');
    if (regionSelect) {
        regionSelect.addEventListener('change', () => {
            const selectedRegion = regionSelect.value;
            const url = new URL(window.location.href);

            if (selectedRegion && selectedRegion !== 'all') {
                url.searchParams.set('region', selectedRegion);
            } else {
                url.searchParams.delete('region');
            }

            window.location.href = url.toString();
        });
    }
};

const hookSeasonSorter = () => {
    const seasonSelect = document.getElementById('season-filter');
    if (seasonSelect) {
        seasonSelect.addEventListener('change', () => {
            const selectedSeason = seasonSelect.value;
            const url = new URL(window.location.href);

            if (selectedSeason && selectedSeason !== 'all') {
                url.searchParams.set('season', selectedSeason);
            } else {
                url.searchParams.delete('season');
            }

            window.location.href = url.toString();
        });
    }
};

const hookTrainsCatalog = async () => {
    const listEl = document.getElementById('trains-list');
    const templateEl = document.getElementById('train-card-template');
    const loadingEl = document.getElementById('trains-loading');
    const errorEl = document.getElementById('trains-error');

    if (!listEl || !templateEl) {
        return;
    }

    try {
        const response = await fetch('/api/trains');
        if (!response.ok) {
            throw new Error(`Failed to load trains (${response.status})`);
        }

        const payload = await response.json();
        const trains = payload.trains || [];
        const fragment = document.createDocumentFragment();

        trains.forEach((train) => {
            const card = templateEl.content.cloneNode(true);
            const imageEl = card.querySelector('[data-field="image"]');

            imageEl.src = train.imageUrl;
            imageEl.alt = train.imageAlt || `${train.name} train`;

            card.querySelector('[data-field="name"]').textContent = train.name;
            card.querySelector('[data-field="operator"]').textContent = train.operator;
            card.querySelector('[data-field="type"]').textContent = train.type;
            card.querySelector('[data-field="speed"]').textContent = `${train.maxSpeedKmh} km/h`;
            card.querySelector('[data-field="seats"]').textContent = `${train.capacity} seats`;
            card.querySelector('[data-field="power"]').textContent = train.powerSource;
            card.querySelector('[data-field="description"]').textContent = train.description;
            card.querySelector('[data-field="best-for"]').textContent = train.bestFor;

            fragment.appendChild(card);
        });

        listEl.replaceChildren(fragment);
        if (loadingEl) {
            loadingEl.hidden = true;
        }
    } catch (error) {
        if (loadingEl) {
            loadingEl.hidden = true;
        }
        if (errorEl) {
            errorEl.hidden = false;
            errorEl.textContent = 'Unable to load trains right now. Please try again in a moment.';
        }
    }
};

const hookStationInfo = () => {
    const buttons = document.querySelectorAll('.station-info-btn');
    const panel = document.getElementById('station-info');
    const content = document.getElementById('station-info-content');
    const closeButton = document.getElementById('close-station-info');

    if (!buttons.length || !panel || !content || !closeButton) return;

    buttons.forEach((button) => {
        button.addEventListener('click', async () => {
            const stationId = button.dataset.stationId;

            panel.hidden = false;
            content.textContent = 'Loading station information...';

            try {
                const response = await fetch(
                    `/api/stations/${encodeURIComponent(stationId)}`
                );

                if (!response.ok) {
                    throw new Error('Unable to fetch station information.');
                }

                const station = await response.json();

                const heading = document.createElement('h3');
                heading.textContent = station.name;

                const location = document.createElement('p');
                location.textContent =
                    `${station.prefecture}, ${station.region}`;

                const description = document.createElement('p');
                description.textContent = station.description;

                const facilitiesHeading = document.createElement('h4');
                facilitiesHeading.textContent = 'Facilities';

                const facilitiesList = document.createElement('ul');

                station.facilities.forEach((facility) => {
                    const item = document.createElement('li');
                    item.textContent = facility;
                    facilitiesList.appendChild(item);
                });

                content.replaceChildren(
                    heading,
                    location,
                    description,
                    facilitiesHeading,
                    facilitiesList
                );
            } catch (error) {
                content.textContent =
                    'Unable to load station information. Please try again.';
            }
        });
    });

    closeButton.addEventListener('click', () => {
        panel.hidden = true;
        content.replaceChildren();
    });
};

const hookTripsCatalog = async () => {
    const listEl = document.getElementById('trips-list');
    const templateEl = document.getElementById('trip-card-template');
    const loadingEl = document.getElementById('trips-loading');
    const errorEl = document.getElementById('trips-error');
    const emptyEl = document.getElementById('trips-empty');
    const regionSelect = document.getElementById('region-filter');
    const seasonSelect = document.getElementById('season-filter');

    if (!listEl || !templateEl) {
        return;
    }

    try {
        const response = await fetch('/api/trips');

        if (!response.ok) {
            throw new Error(`Failed to load trips (${response.status})`);
        }

        const trips = await response.json();

        // Populate the region and season filters.
        const regions = [...new Set(trips.map((trip) => trip.region))].sort();
        const seasons = [...new Set(trips.map((trip) => trip.bestSeason))].sort();

        regions.forEach((region) => {
            const option = document.createElement('option');
            option.value = region;
            option.textContent = region.charAt(0).toUpperCase() + region.slice(1);
            regionSelect.appendChild(option);
        });

        seasons.forEach((season) => {
            const option = document.createElement('option');
            option.value = season;
            option.textContent = season.charAt(0).toUpperCase() + season.slice(1);
            seasonSelect.appendChild(option);
        });

        // Restore filters from the URL if they were previously selected.
        const params = new URLSearchParams(window.location.search);

        if (regions.includes(params.get('region'))) {
            regionSelect.value = params.get('region');
        }

        if (seasons.includes(params.get('season'))) {
            seasonSelect.value = params.get('season');
        }

        const renderTrips = () => {
            const selectedRegion = regionSelect.value;
            const selectedSeason = seasonSelect.value;

            const filteredTrips = trips.filter((trip) => {
                const matchesRegion =
                    selectedRegion === 'all' || trip.region === selectedRegion;

                const matchesSeason =
                    selectedSeason === 'all' || trip.bestSeason === selectedSeason;

                return matchesRegion && matchesSeason;
            });

            const fragment = document.createDocumentFragment();

            filteredTrips.forEach((trip) => {
                const card = templateEl.content.cloneNode(true);

                const cardEl = card.querySelector('.route-card');
                cardEl.classList.add(trip.region);

                card.querySelector('[data-field="name"]').textContent = trip.name;
                card.querySelector('[data-field="region"]').textContent = trip.region;
                card.querySelector('[data-field="start-station"]').textContent =
                    trip.startStation;
                card.querySelector('[data-field="end-station"]').textContent =
                    trip.endStation;
                card.querySelector('[data-field="duration"]').textContent =
                    trip.duration;
                card.querySelector('[data-field="distance"]').textContent =
                    trip.distance;

                const seasonEl = card.querySelector('[data-field="season"]');
                seasonEl.textContent = `Best in ${trip.bestSeason}`;
                seasonEl.classList.add(`season-${trip.bestSeason}`);

                card.querySelector('[data-field="description"]').textContent =
                    trip.description;

                const highlightsEl = card.querySelector('[data-field="highlights"]');

                trip.highlights.forEach((highlight) => {
                    const tag = document.createElement('span');
                    tag.classList.add('highlight-tag');
                    tag.textContent = highlight;
                    highlightsEl.appendChild(tag);
                });

                const detailsLink = card.querySelector('[data-field="details-link"]');
                detailsLink.href = `/trips/${encodeURIComponent(trip.id)}`;

                fragment.appendChild(card);
            });

            listEl.replaceChildren(fragment);

            if (emptyEl) {
                emptyEl.hidden = filteredTrips.length > 0;
            }
        };

        // Update the list when a filter changes.
        regionSelect.addEventListener('change', renderTrips);
        seasonSelect.addEventListener('change', renderTrips);

        renderTrips();

        if (loadingEl) {
            loadingEl.hidden = true;
        }
    } catch (error) {
        console.error('Error loading trips:', error);

        if (loadingEl) {
            loadingEl.hidden = true;
        }

        if (errorEl) {
            errorEl.hidden = false;
            errorEl.textContent =
                'Unable to load trips right now. Please try again in a moment.';
        }
    }
};

const hookBookingsCatalog = async () => {
    const listEl = document.getElementById('bookings-list');
    const templateEl = document.getElementById('booking-card-template');

    if (!listEl || !templateEl) return;

    try {
        const response = await fetch('/api/bookings');

        if (!response.ok) {
            throw new Error(`Failed to load bookings (${response.status})`);
        }

        const bookings = await response.json();

        const fragment = document.createDocumentFragment();

        bookings.forEach((booking) => {
            const card = templateEl.content.cloneNode(true);

            card.querySelector('[data-field="id"]').textContent = booking.id;
            card.querySelector('[data-field="tripId"]').textContent = booking.tripId;
            card.querySelector('[data-field="scheduleId"]').textContent = booking.scheduleId;
            card.querySelector('[data-field="ticketClass"]').textContent = booking.ticketClass;
            card.querySelector('[data-field="selectedDay"]').textContent = booking.selectedDay;
            card.querySelector('[data-field="createdAt"]').textContent = booking.createdAt;

            const passengersList = card.querySelector('[data-field="passengers"]');

            booking.passengers.forEach((passenger) => {
                const li = document.createElement('li');
                li.textContent = `${passenger.firstName} ${passenger.lastName}`;
                passengersList.appendChild(li);
            });

            fragment.appendChild(card);
        });

        listEl.replaceChildren(fragment);
        document.getElementById('bookings-loading').hidden = true;
        document.getElementById('bookings-empty').hidden = bookings.length > 0;

    } catch (error) {
        console.error('Error loading bookings:', error);

        document.getElementById('bookings-loading').hidden = true;

        const errorEl = document.getElementById('bookings-error');
        errorEl.textContent = 'Unable to load bookings. Please try again.';
        errorEl.hidden = false;
    }
};

document.addEventListener('DOMContentLoaded', () => {
    hookTrainsCatalog();
    hookStationInfo();
    hookTripsCatalog();
    hookBookingsCatalog();
});
