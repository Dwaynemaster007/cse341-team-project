import { describe, expect, test } from 'vitest';
import request from 'supertest';
import app from '../app.js';

describe('GET /api/trips (pagination)', () => {
  test('returns the first 10 trips sorted by name, with pagination metadata', async () => {
    const response = await request(app).get('/api/trips');

    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toContain('application/json');
    expect(response.body.data).toHaveLength(10);
    expect(response.body.pagination).toEqual({
      page: 1,
      limit: 10,
      totalItems: 14,
      totalPages: 2,
      hasNextPage: true,
      hasPreviousPage: false
    });
    expect(response.body.query).toEqual({ sort: 'name', order: 'asc' });

    const names = response.body.data.map((trip) => trip.name);
    expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b)));
  });

  test('page 2 returns the remaining trips with no overlap', async () => {
    const first = await request(app).get('/api/trips?page=1');
    const second = await request(app).get('/api/trips?page=2');

    expect(second.status).toBe(200);
    expect(second.body.data).toHaveLength(4);
    expect(second.body.pagination).toMatchObject({ page: 2, hasNextPage: false, hasPreviousPage: true });

    const firstIds = first.body.data.map((trip) => trip.id);
    const secondIds = second.body.data.map((trip) => trip.id);
    expect(secondIds.some((id) => firstIds.includes(id))).toBe(false);
    expect(new Set([...firstIds, ...secondIds]).size).toBe(14);
  });

  test('limit controls the page size and the number of pages', async () => {
    const response = await request(app).get('/api/trips?limit=5&page=3');

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(4);
    expect(response.body.pagination).toMatchObject({ page: 3, limit: 5, totalPages: 3, hasNextPage: false });
  });

  test('sort and order change the order of the results', async () => {
    const response = await request(app).get('/api/trips?sort=distance&order=desc&limit=3');

    expect(response.status).toBe(200);
    const distances = response.body.data.map((trip) => trip.distance);
    expect(distances).toEqual([260, 185, 185]);
    expect(response.body.query).toEqual({ sort: 'distance', order: 'desc' });
  });

  test('a page past the last one returns 200 with an empty data array', async () => {
    const response = await request(app).get('/api/trips?page=99');

    expect(response.status).toBe(200);
    expect(response.body.data).toEqual([]);
    expect(response.body.pagination).toMatchObject({ page: 99, totalItems: 14, hasNextPage: false });
  });

  test.each([
    ['page=abc', 'page'],
    ['page=0', 'page'],
    ['page=1.5', 'page'],
    ['page=1&page=2', 'page'],
    ['limit=0', 'limit'],
    ['limit=-5', 'limit'],
    ['limit=51', 'limit'],
    ['sort=password', 'sort'],
    ['order=up', 'order']
  ])('rejects %s with 400 and names the field', async (queryString, field) => {
    const response = await request(app).get(`/api/trips?${queryString}`);

    expect(response.status).toBe(400);
    expect(response.body.message).toBe('Invalid query parameters');
    expect(response.body.errors).toEqual([expect.objectContaining({ field })]);
  });

  test('reports every invalid parameter at once', async () => {
    const response = await request(app).get('/api/trips?page=0&limit=500');

    expect(response.status).toBe(400);
    expect(response.body.errors.map((error) => error.field)).toEqual(['page', 'limit']);
  });
});

describe('GET /api/trips (search and filters)', () => {
  const ids = (response) => response.body.data.map((trip) => trip.id).sort();

  test('region returns only trips in that region, and the metadata counts only matches', async () => {
    const response = await request(app).get('/api/trips?region=kansai');

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(5);
    expect(response.body.data.every((trip) => trip.region === 'kansai')).toBe(true);
    expect(response.body.pagination).toMatchObject({ totalItems: 5, totalPages: 1, hasNextPage: false });
    expect(response.body.query).toEqual({ region: 'kansai', sort: 'name', order: 'asc' });
  });

  test('season filters by best season', async () => {
    const response = await request(app).get('/api/trips?season=winter');

    expect(response.status).toBe(200);
    expect(ids(response)).toEqual(['hida-snow-express', 'snow-country-limited', 'winter-wetlands']);
  });

  test('region and season work together', async () => {
    const response = await request(app).get('/api/trips?region=kansai&season=summer');

    expect(response.status).toBe(200);
    expect(ids(response)).toEqual(['hozu-river-twilight', 'kishu-coast-limited']);
    expect(response.body.pagination.totalItems).toBe(2);
  });

  test('q matches the name or the description, ignoring case', async () => {
    const response = await request(app).get('/api/trips?q=GORGE');

    expect(response.status).toBe(200);
    expect(ids(response)).toEqual([
      'gorge-explorer',
      'hozu-river-twilight',
      'kurobe-valley-connector',
      'romantic-gorge'
    ]);
    expect(response.body.query.q).toBe('GORGE');
  });

  test('q, filters and pagination combine, and the counts cover every page', async () => {
    const response = await request(app).get('/api/trips?q=river&region=kansai&limit=1&page=2');

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(1);
    expect(response.body.pagination).toMatchObject({ page: 2, limit: 1, totalItems: 3, totalPages: 3 });
    expect(response.body.query).toEqual({ q: 'river', region: 'kansai', sort: 'name', order: 'asc' });
  });

  test('search text with regular-expression characters is treated as plain text', async () => {
    const response = await request(app).get(`/api/trips?q=${encodeURIComponent('.*(')}`);

    expect(response.status).toBe(200);
    expect(response.body.data).toEqual([]);
  });

  test('no matches returns 200 with an empty data array and zero totals', async () => {
    const response = await request(app).get('/api/trips?q=volcano');

    expect(response.status).toBe(200);
    expect(response.body.data).toEqual([]);
    expect(response.body.pagination).toMatchObject({ totalItems: 0, totalPages: 0, hasNextPage: false });
  });

  test.each([
    ['q=', 'q'],
    ['q=%20%20', 'q'],
    [`q=${'a'.repeat(101)}`, 'q'],
    ['q=a&q=b', 'q'],
    ['region=mars', 'region'],
    ['season=monsoon', 'season']
  ])('rejects %s with 400 and names the field', async (queryString, field) => {
    const response = await request(app).get(`/api/trips?${queryString}`);

    expect(response.status).toBe(400);
    expect(response.body.message).toBe('Invalid query parameters');
    expect(response.body.errors).toEqual([expect.objectContaining({ field })]);
  });

  test('reports filter and pagination problems together', async () => {
    const response = await request(app).get('/api/trips?region=mars&limit=0');

    expect(response.status).toBe(400);
    expect(response.body.errors.map((error) => error.field)).toEqual(['region', 'limit']);
  });

  test('GET /trips renders the region and season dropdown options', async () => {
    const response = await request(app).get('/trips');

    expect(response.status).toBe(200);
    expect(response.text).toContain('<option value="kansai">Kansai</option>');
    expect(response.text).toContain('<option value="winter">Winter</option>');
    expect(response.text).toContain('id="trip-search"');
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
    expect(response.text).toContain('id="trips-pagination"');
    expect(response.text).toContain('/js/trips-list.js');
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
