import { describe, expect, test } from 'vitest';
import request from 'supertest';
import app from '../app.js';

describe('GET /api/trips', () => {
  test('returns all starter trips as JSON', async () => {
    const response = await request(app).get('/api/trips');

    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toContain('application/json');
    expect(response.body).toHaveLength(6);
    expect(response.body).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: 'alpine-panorama', startStation: 'nagoya' })
      ])
    );
  });
});

describe('GET /api/trips/:id', () => {
  test('returns one trip for an existing id', async () => {
    const response = await request(app).get('/api/trips/alpine-panorama');

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({ id: 'alpine-panorama', name: 'Alpine Panorama Express' });
  });

  test('returns 404 with a JSON message for a missing id', async () => {
    const response = await request(app).get('/api/trips/no-such-trip');

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ message: 'Trip not found' });
  });
});

describe('Trip pages', () => {
  test('GET /trips renders the list page shell', async () => {
    const response = await request(app).get('/trips');

    expect(response.status).toBe(200);
    expect(response.text).toContain('id="trip-card-template"');
  });

  test('GET /trips/:tripId renders the details page', async () => {
    const response = await request(app).get('/trips/alpine-panorama');

    expect(response.status).toBe(200);
    expect(response.text).toContain('Alpine Panorama Express');
  });

  test('GET /trips/:tripId shows the 404 page for a missing trip', async () => {
    const response = await request(app).get('/trips/no-such-trip');

    expect(response.status).toBe(404);
    expect(response.text).toContain('<title>Page Not Found</title>');
  });
});
