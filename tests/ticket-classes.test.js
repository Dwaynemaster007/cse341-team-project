
import { describe, expect, test } from 'vitest';
import request from 'supertest';
import app from '../app.js';

describe('GET /api/ticket-classes', () => {
  test('returns all three ticket classes', async () => {
    const response = await request(app).get('/api/ticket-classes');

    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toContain('application/json');
    expect(response.body).toHaveLength(3);
  });

  test('returns Standard and Premium classes on Monday', async () => {
    const response = await request(app).get(
      '/api/ticket-classes?day=monday'
    );

    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(2);
    expect(response.body.map((item) => item.class).sort()).toEqual([
      'premium',
      'standard',
    ]);
  });

  test('returns all three ticket classes on Friday', async () => {
    const response = await request(app).get(
      '/api/ticket-classes?day=friday'
    );

    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(3);
    expect(response.body.map((item) => item.class).sort()).toEqual([
      'first',
      'premium',
      'standard',
    ]);
  });

  test('rejects an invalid weekday', async () => {
    const response = await request(app).get(
      '/api/ticket-classes?day=funday'
    );

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('message');
    expect(response.body).toHaveProperty('validDays');
    expect(response.body.validDays).toContain('monday');
    expect(response.body.validDays).toContain('sunday');
  });
});
