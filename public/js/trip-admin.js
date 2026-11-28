document.addEventListener('DOMContentLoaded', () => {
    const tripsList = document.getElementById('trips-admin-list');
    const message = document.getElementById('trips-message');

    // Read the stations, schedules, and bookings provided by the server.
    const referenceDataElement = document.getElementById('admin-reference-data');
    const referenceData = JSON.parse(referenceDataElement.textContent);

    const { stations, schedules, bookedScheduleIds } = referenceData;

    // Display messages to the administrator.
    const showMessage = (text, isError = false) => {
        message.textContent = text;
        message.classList.toggle('error', isError);
    };

    // Create an HTML element safely using textContent.
    const createElement = (tag, text, className) => {
        const element = document.createElement(tag);

        if (text !== undefined) {
            element.textContent = text;
        }

        if (className) {
            element.classList.add(className);
        }

        return element;
    };

    // Create a select element with the available stations.
    const createStationSelect = (fieldName, selectedStation) => {
        const label = createElement('label', fieldName === 'startStation'
            ? 'Start Station'
            : 'End Station');

        const select = document.createElement('select');
        select.name = fieldName;
        select.required = true;

        stations.forEach((station) => {
            const option = document.createElement('option');
            option.value = station.id;
            option.textContent = station.name;
            option.selected = station.id === selectedStation;
            select.appendChild(option);
        });

        label.appendChild(select);
        return label;
    };

    // Create the schedule selection section.
    const createScheduleOptions = (trip) => {
        const section = createElement('fieldset');
        const legend = createElement('legend', 'Schedules');

        section.appendChild(legend);

        const description = createElement(
            'p',
            'Select existing schedules to assign to this trip. Existing assignments are not removed when unchecked.'
        );

        section.appendChild(description);

        schedules.forEach((schedule) => {
            const label = document.createElement('label');
            const checkbox = document.createElement('input');

            const belongsToTrip = schedule.tripId === trip.id;
            const hasBookings = bookedScheduleIds.includes(String(schedule.id));
            const assignedToAnotherTrip = schedule.tripId && !belongsToTrip;

            checkbox.type = 'checkbox';
            checkbox.name = 'scheduleIds';
            checkbox.value = schedule.id;
            checkbox.checked = belongsToTrip;

            // A booked schedule cannot be reassigned to another trip.
            if (hasBookings && assignedToAnotherTrip) {
                checkbox.disabled = true;
            }

            // A booked schedule already assigned to this trip stays selected.
            if (hasBookings && belongsToTrip) {
                checkbox.disabled = true;
            }

            const status = schedule.status ? 'Active' : 'Inactive';
            const currentTrip = belongsToTrip
                ? ' (Currently assigned)'
                : schedule.tripId
                    ? ` (Assigned to ${schedule.tripId})`
                    : ' (Unassigned)';

            const bookingNotice = hasBookings ? ' - Has bookings' : '';

            label.append(
                checkbox,
                document.createTextNode(
                    ` Schedule ${schedule.id}: ${schedule.departureTime} - ${schedule.arrivalTime} | ${status}${currentTrip}${bookingNotice}`
                )
            );

            section.appendChild(label);
            section.appendChild(document.createElement('br'));
        });

        return section;
    };

    // Create the trip editing form.
    const createEditForm = (trip) => {
        const form = document.createElement('form');
        form.classList.add('trip-edit-form');

        const fields = [
            { name: 'name', label: 'Trip Name', value: trip.name },
            { name: 'description', label: 'Description', value: trip.description },
            { name: 'region', label: 'Region', value: trip.region },
            { name: 'duration', label: 'Duration', value: trip.duration },
            { name: 'distance', label: 'Distance', value: trip.distance, type: 'number' },
            { name: 'bestSeason', label: 'Best Season', value: trip.bestSeason },
            { name: 'imageUrl', label: 'Image URL', value: trip.imageUrl },
            {
                name: 'highlights',
                label: 'Highlights (separate with commas)',
                value: trip.highlights.join(', ')
            },
            {
                name: 'operatingMonths',
                label: 'Operating Months (1-12, separate with commas)',
                value: trip.operatingMonths.join(', ')
            }
        ];

        fields.forEach((field) => {
            const label = createElement('label', field.label);
            const input = document.createElement('input');

            input.name = field.name;
            input.type = field.type || 'text';
            input.value = field.value;
            input.required = true;

            label.appendChild(input);
            form.appendChild(label);
        });

        form.appendChild(createStationSelect('startStation', trip.startStation));
        form.appendChild(createStationSelect('endStation', trip.endStation));
        form.appendChild(createScheduleOptions(trip));

        const saveButton = createElement('button', 'Save Changes');
        saveButton.type = 'submit';

        const cancelButton = createElement('button', 'Cancel');
        cancelButton.type = 'button';

        cancelButton.addEventListener('click', () => {
            form.remove();
        });

        form.append(saveButton, cancelButton);

        form.addEventListener('submit', async (event) => {
            event.preventDefault();

            const formData = new FormData(form);

            const operatingMonths = formData.get('operatingMonths')
                .split(',')
                .map((month) => Number(month.trim()));

            const distance = Number(formData.get('distance'));

            const tripData = {
                name: formData.get('name').trim(),
                description: formData.get('description').trim(),
                region: formData.get('region').trim(),
                duration: formData.get('duration').trim(),
                distance,
                bestSeason: formData.get('bestSeason').trim(),
                imageUrl: formData.get('imageUrl').trim(),
                highlights: formData.get('highlights')
                    .split(',')
                    .map((highlight) => highlight.trim())
                    .filter(Boolean),
                operatingMonths,
                startStation: formData.get('startStation'),
                endStation: formData.get('endStation'),
                scheduleIds: formData.getAll('scheduleIds').map(Number)
            };

            if (
                !Number.isFinite(distance) ||
                distance < 0 ||
                operatingMonths.some(
                    (month) => !Number.isInteger(month) || month < 1 || month > 12
                )
            ) {
                showMessage('Please enter a valid distance and operating months.', true);
                return;
            }

            try {
                const response = await fetch(`/api/trips/${trip.id}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(tripData)
                });

                const result = await response.json();

                if (!response.ok) {
                    throw new Error(result.message || 'Unable to update trip');
                }

                showMessage('Trip updated successfully.');
                await loadTrips();
            } catch (error) {
                console.error('Error updating trip:', error);
                showMessage(error.message, true);
            }
        });

        return form;
    };

    // Load all trips from the API.
    const loadTrips = async () => {
        try {
            const response = await fetch('/api/trips');

            if (!response.ok) {
                throw new Error('Failed to load trips');
            }

            const trips = await response.json();

            tripsList.innerHTML = '';

            if (trips.length === 0) {
                tripsList.textContent = 'No trips available.';
                return;
            }

            trips.forEach((trip) => {
                const tripCard = createElement('article', undefined, 'trip-admin-card');

                const title = createElement('h2', trip.name);
                const description = createElement('p', trip.description);
                const region = createElement('p', `Region: ${trip.region}`);

                const editButton = createElement('button', 'Edit Trip');
                editButton.type = 'button';

                const deleteButton = createElement('button', 'Delete Trip');
                deleteButton.type = 'button';

                editButton.addEventListener('click', () => {
                    const existingForm = tripCard.querySelector('.trip-edit-form');

                    if (existingForm) {
                        existingForm.remove();
                    } else {
                        tripCard.appendChild(createEditForm(trip));
                    }
                });

                deleteButton.addEventListener('click', async () => {
                    const confirmed = window.confirm(
                        `Are you sure you want to delete "${trip.name}"?`
                    );

                    if (!confirmed) {
                        return;
                    }

                    try {
                        const response = await fetch(`/api/trips/${trip.id}`, {
                            method: 'DELETE'
                        });

                        const result = await response.json();

                        if (!response.ok) {
                            throw new Error(result.message || 'Unable to delete trip');
                        }

                        showMessage('Trip deleted successfully.');
                        await loadTrips();
                    } catch (error) {
                        console.error('Error deleting trip:', error);
                        showMessage(error.message, true);
                    }
                });

                tripCard.append(
                    title,
                    description,
                    region,
                    editButton,
                    deleteButton
                );

                tripsList.appendChild(tripCard);
            });
        } catch (error) {
            console.error('Error loading trips:', error);
            showMessage('Unable to load trips. Please try again.', true);
        }
    };

    loadTrips();
});