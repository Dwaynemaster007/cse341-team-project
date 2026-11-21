import { beforeEach, describe, expect, test } from 'vitest';
import request from 'supertest';
import app from '../app.js';
import User from '../src/models/schemas/users.js';
import { setUserRole } from '../src/models/users.js';
import { requireApiLogin, requireApiRole } from '../src/middleware/auth.js';

const customer = {
  displayName: 'Test Customer',
  username: 'test.customer',
  email: 'customer.test@example.com',
  password: 'correct-horse-1',
  confirmPassword: 'correct-horse-1'
};

const register = (agent, overrides = {}) => {
  return agent.post('/register').type('form').send({ ...customer, ...overrides });
};

const login = (agent, email = customer.email, password = customer.password) => {
  return agent.post('/login').type('form').send({ email, password });
};

beforeEach(async () => {
  // The test database is dropped before every test, so rebuild the unique indexes.
  await User.syncIndexes();
});

describe('Registration', () => {
  test('creates a customer account with a hashed password and redirects to login', async () => {
    const response = await register(request(app));

    expect(response.status).toBe(302);
    expect(response.headers.location).toBe('/login?registered=1');

    const saved = await User.findOne({ email: customer.email }).populate('role');
    expect(saved.role.name).toBe('customer');
    expect(saved.passwordHash).not.toBe(customer.password);
    expect(saved.passwordHash).toMatch(/^\$2[aby]\$/);
  });

  test('ignores a role sent by the browser', async () => {
    await register(request(app), { role: 'admin' });

    const saved = await User.findOne({ email: customer.email }).populate('role');
    expect(saved.role.name).toBe('customer');
  });

  test('rejects mismatched passwords with 400 and keeps the typed values', async () => {
    const response = await register(request(app), { confirmPassword: 'something-else' });

    expect(response.status).toBe(400);
    expect(response.text).toContain('Passwords do not match.');
    expect(response.text).toContain('customer.test@example.com');
    expect(await User.countDocuments()).toBe(0);
  });

  test('rejects a duplicate email with 409', async () => {
    await register(request(app));
    const response = await register(request(app), { username: 'another.user' });

    expect(response.status).toBe(409);
    expect(response.text).toContain('already exists');
  });
});

describe('Login and logout', () => {
  test('signs in a customer, stores the user in the session, and logs out', async () => {
    const agent = request.agent(app);
    await register(agent);

    const loginResponse = await login(agent);
    expect(loginResponse.status).toBe(302);
    expect(loginResponse.headers.location).toBe('/');

    // A signed-in customer is sent away from the login page.
    const loginPage = await agent.get('/login');
    expect(loginPage.status).toBe(302);

    const logoutResponse = await agent.post('/logout');
    expect(logoutResponse.status).toBe(302);

    const afterLogout = await agent.get('/login');
    expect(afterLogout.status).toBe(200);
  });

  test('uses the same 401 message for a wrong password and an unknown email', async () => {
    await register(request(app));

    const wrongPassword = await login(request(app), customer.email, 'wrong-password');
    const unknownEmail = await login(request(app), 'nobody@example.com', 'whatever-123');

    expect(wrongPassword.status).toBe(401);
    expect(unknownEmail.status).toBe(401);
    expect(wrongPassword.text).toContain('Invalid email or password.');
    expect(unknownEmail.text).toContain('Invalid email or password.');
  });

  test('sends admins to the admin dashboard after login', async () => {
    const agent = request.agent(app);
    await register(agent);
    await setUserRole(customer.email, 'admin');

    const response = await login(agent);
    expect(response.headers.location).toBe('/admin');
  });
});

describe('Page guards on /admin', () => {
  test('signed out: redirects to /login', async () => {
    const response = await request(app).get('/admin');

    expect(response.status).toBe(302);
    expect(response.headers.location).toBe('/login');
  });

  test('signed in as customer: shows the 403 page', async () => {
    const agent = request.agent(app);
    await register(agent);
    await login(agent);

    const response = await agent.get('/admin');
    expect(response.status).toBe(403);
    expect(response.text).toContain('Access Denied');
  });

  test('signed in as admin: shows the dashboard', async () => {
    const agent = request.agent(app);
    await register(agent);
    await setUserRole(customer.email, 'admin');
    await login(agent);

    const response = await agent.get('/admin');
    expect(response.status).toBe(200);
    expect(response.text).toContain('Welcome to the Admin Dashboard');
  });
});

describe('API guards', () => {
  test('requireApiLogin returns 401 JSON when signed out and calls next when signed in', () => {
    const res = { status: (code) => ({ json: (body) => ({ code, body }) }) };

    expect(requireApiLogin({ user: null }, res, () => 'next')).toEqual({ code: 401, body: { message: 'Authentication required' } });
    expect(requireApiLogin({ user: { role: 'customer' } }, res, () => 'next')).toBe('next');
  });

  test('requireApiRole returns 401, 403, or calls next depending on the user', () => {
    const res = { status: (code) => ({ json: (body) => ({ code, body }) }) };
    const guard = requireApiRole('admin');

    expect(guard({ user: null }, res, () => 'next')).toEqual({ code: 401, body: { message: 'Authentication required' } });
    expect(guard({ user: { role: 'customer' } }, res, () => 'next')).toEqual({ code: 403, body: { message: 'Forbidden' } });
    expect(guard({ user: { role: 'admin' } }, res, () => 'next')).toBe('next');
  });
});
