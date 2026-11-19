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

document.addEventListener('DOMContentLoaded', () => {
    hookRegionSorter();
    hookSeasonSorter();
    hookTrainsCatalog();
    hookStationInfo();
});
;