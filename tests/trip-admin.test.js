import { beforeEach, describe, expect, test } from 'vitest';
import request from 'supertest';
import app from '../app.js';
import User from '../src/models/schemas/users.js';
import { setUserRole } from '../src/models/users.js';
import { getDb } from '../src/db/connect.js';

const customer = {
    displayName: 'Trip Admin Tester',
    username: 'trip.admin.tester',
    email: 'trip.admin.tester@example.com',
    password: 'correct-horse-1',
    confirmPassword: 'correct-horse-1'
};

const register = (agent) => {
    return agent
        .post('/register')
        .type('form')
        .send(customer);
};

const login = (agent) => {
    return agent
        .post('/login')
        .type('form')
        .send({
            email: customer.email,
            password: customer.password
        });
};

const createCustomerAgent = async () => {
    const agent = request.agent(app);

    await register(agent);
    await login(agent);

    return agent;
};

const createAdminAgent = async () => {
    const agent = request.agent(app);

    await register(agent);
    await setUserRole(customer.email, 'admin');
    await login(agent);

    return agent;
};

const getTripUpdateData = (trip, scheduleIds = []) => ({
    name: trip.name,
    description: trip.description,
    region: trip.region,
    startStation: trip.startStation,
    endStation: trip.endStation,
    duration: trip.duration,
    distance: trip.distance,
    highlights: trip.highlights,
    bestSeason: trip.bestSeason,
    operatingMonths: trip.operatingMonths,
    imageUrl: trip.imageUrl,
    scheduleIds
});

beforeEach(async () => {
    await User.syncIndexes();
});

describe('Protected trip admin page', () => {
    test('redirects signed-out users to login', async () => {
        const response = await request(app).get('/admin/trips');

        expect(response.status).toBe(302);
        expect(response.headers.location).toBe('/login');
    });

    test('denies access to customers', async () => {
        const agent = await createCustomerAgent();

        const response = await agent.get('/admin/trips');

        expect(response.status).toBe(403);
        expect(response.text).toContain('Access Denied');
    });

    test('allows administrators to view the trip admin page', async () => {
        const agent = await createAdminAgent();

        const response = await agent.get('/admin/trips');

        expect(response.status).toBe(200);
        expect(response.text).toContain('Manage Trips');
        expect(response.text).toContain('admin-reference-data');
    });
});

describe('Protected trip API', () => {
    test('requires authentication to update a trip', async () => {
        const response = await request(app)
            .put('/api/trips/alpine-panorama')
            .send({});

        expect(response.status).toBe(401);
        expect(response.body).toEqual({
            message: 'Authentication required'
        });
    });

    test('denies customers access to update and delete trips', async () => {
        const agent = await createCustomerAgent();

        const updateResponse = await agent
            .put('/api/trips/alpine-panorama')
            .send({});

        const deleteResponse = await agent
            .delete('/api/trips/alpine-panorama');

        expect(updateResponse.status).toBe(403);
        expect(updateResponse.body).toEqual({ message: 'Forbidden' });

        expect(deleteResponse.status).toBe(403);
        expect(deleteResponse.body).toEqual({ message: 'Forbidden' });
    });

    test('allows administrators to update an existing trip', async () => {
        const agent = await createAdminAgent();

        const tripResponse = await agent.get('/api/trips/alpine-panorama');
        expect(tripResponse.status).toBe(200);

        const updateData = getTripUpdateData(tripResponse.body);
        updateData.name = 'Updated Alpine Panorama';

        const response = await agent
            .put('/api/trips/alpine-panorama')
            .send(updateData);

        expect(response.status).toBe(200);
        expect(response.body.trip.name).toBe('Updated Alpine Panorama');

        const savedTrip = await agent.get('/api/trips/alpine-panorama');
        expect(savedTrip.body.name).toBe('Updated Alpine Panorama');
    });

    test('does not allow reassignment of a booked schedule', async () => {
        const agent = await createAdminAgent();
        const db = getDb();

        // Schedule 1 initially belongs to alpine-panorama.
        await db.collection('bookings').insertOne({
            id: 'test-booking-1',
            createdAt: '2026-11-27',
            scheduleId: '1',
            tripId: 'alpine-panorama',
            ticketClass: 'standard',
            selectedDay: 'Monday',
            passengers: [{
                firstName: 'Test',
                lastName: 'Passenger',
                email: 'passenger@example.com',
                phone: '123456789'
            }]
        });

        const tripResponse = await agent.get('/api/trips/coastal-breeze');
        expect(tripResponse.status).toBe(200);

        const updateData = getTripUpdateData(tripResponse.body, [1]);

        const response = await agent
            .put('/api/trips/coastal-breeze')
            .send(updateData);

        expect(response.status).toBe(400);
        expect(response.body.message).toContain('bookings');
    });

    test('does not allow deleting a trip with associated schedules', async () => {
        const agent = await createAdminAgent();

        const response = await agent
            .delete('/api/trips/alpine-panorama');

        expect(response.status).toBe(409);
        expect(response.body.message).toContain('associated schedules');

        const tripResponse = await agent.get('/api/trips/alpine-panorama');
        expect(tripResponse.status).toBe(200);
    });

    test('allows deleting a trip without associated schedules or bookings', async () => {
        const agent = await createAdminAgent();
        const db = getDb();
        const tripId = 'romantic-gorge';

        // Remove related test data so the trip can be deleted safely.
        await db.collection('schedules').deleteMany({ tripId });
        await db.collection('bookings').deleteMany({ tripId });

        const response = await agent.delete(`/api/trips/${tripId}`);

        expect(response.status).toBe(200);
        expect(response.body.message).toBe('Trip deleted successfully');

        const tripResponse = await agent.get(`/api/trips/${tripId}`);
        expect(tripResponse.status).toBe(404);
    });
});