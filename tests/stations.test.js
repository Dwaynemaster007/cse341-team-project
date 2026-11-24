import { describe, expect, test } from 'vitest';
import request from 'supertest';
import app from '../app.js';

describe('GET /api/stations', () => {
  test('returns all stations as JSON', async () => {
    const response = await request(app).get('/api/stations');

    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toContain('application/json');
    expect(response.body.stations).toHaveLength(12);
    expect(response.body.stations).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: 'nagoya', name: 'Nagoya Station' })
      ])
    );
  });
});

describe('GET /api/stations/:id', () => {
  test('returns the requested station', async () => {
    const response = await request(app).get('/api/stations/nagoya');

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      id: 'nagoya',
      name: 'Nagoya Station',
      prefecture: 'Aichi'
    });
  });

  test('returns 404 for an unknown station ID', async () => {
    const response = await request(app).get('/api/stations/no-such-station');

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ error: 'Station not found' });
  });
});
