import { createUser, findUserByEmail, verifyPassword } from '../models/users.js';

const DUPLICATE_KEY_ERROR = 11000;
const MIN_PASSWORD_LENGTH = 8;
const USERNAME_PATTERN = /^[a-z0-9._-]{3,30}$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const trimmed = (value) => {
    return typeof value === 'string' ? value.trim() : '';
};

/**
 * Re-renders a form with an error message, keeping what the user typed
 * (never the password) so they do not have to start over.
 */
const renderForm = (res, view, title, status, errors, values = {}) => {
    return res.status(status).render(view, { title, errors, values });
};

/**
 * Session regeneration gives the signed-in user a brand-new session id,
 * which prevents session fixation attacks.
 */
const regenerateSession = (req) => {
    return new Promise((resolve, reject) => {
        req.session.regenerate((error) => {
            if (error) {
                return reject(error);
            }
            return resolve();
        });
    });
};

const destroySession = (req) => {
    return new Promise((resolve, reject) => {
        req.session.destroy((error) => {
            if (error) {
                return reject(error);
            }
            return resolve();
        });
    });
};

const validateRegistration = ({ displayName, username, email, password, confirmPassword }) => {
    const errors = [];

    if (!displayName || !username || !email || !password) {
        errors.push('Display name, username, email, and password are required.');
    }
    if (username && !USERNAME_PATTERN.test(username)) {
        errors.push('Username must be 3-30 characters: lowercase letters, numbers, dots, dashes, or underscores.');
    }
    if (email && !EMAIL_PATTERN.test(email)) {
        errors.push('Enter a valid email address.');
    }
    if (password && password.length < MIN_PASSWORD_LENGTH) {
        errors.push(`Password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
    }
    if (password !== confirmPassword) {
        errors.push('Passwords do not match.');
    }

    return errors;
};

// GET /register
const registerPage = (req, res) => {
    if (req.user) {
        return res.redirect('/');
    }
    return renderForm(res, 'auth/register', 'Create an Account', 200, []);
};

// POST /register
const register = async (req, res, next) => {
    const values = {
        displayName: trimmed(req.body?.displayName),
        username: trimmed(req.body?.username).toLowerCase(),
        email: trimmed(req.body?.email).toLowerCase()
    };
    const password = typeof req.body?.password === 'string' ? req.body.password : '';
    const confirmPassword = typeof req.body?.confirmPassword === 'string' ? req.body.confirmPassword : '';

    const errors = validateRegistration({ ...values, password, confirmPassword });

    if (errors.length > 0) {
        return renderForm(res, 'auth/register', 'Create an Account', 400, errors, values);
    }

    try {
        await createUser({ ...values, password });
        return res.redirect('/login?registered=1');
    } catch (error) {
        if (error.code === DUPLICATE_KEY_ERROR) {
            return renderForm(res, 'auth/register', 'Create an Account', 409,
                ['An account with that username or email already exists.'], values);
        }
        if (error.name === 'ValidationError') {
            return renderForm(res, 'auth/register', 'Create an Account', 400,
                ['Please check your details and try again.'], values);
        }
        return next(error);
    }
};

// GET /login
const loginPage = (req, res) => {
    if (req.user) {
        return res.redirect('/');
    }
    return renderForm(res, 'auth/login', 'Sign In', 200, []);
};

// POST /login
const login = async (req, res, next) => {
    const email = trimmed(req.body?.email).toLowerCase();
    const password = typeof req.body?.password === 'string' ? req.body.password : '';

    if (!email || !password) {
        return renderForm(res, 'auth/login', 'Sign In', 400, ['Email and password are required.'], { email });
    }

    try {
        const user = await findUserByEmail(email);
        const passwordMatches = user ? await verifyPassword(password, user.passwordHash) : false;

        // The same message for an unknown email and a wrong password, so the form
        // does not reveal which emails have accounts.
        if (!user || !passwordMatches) {
            return renderForm(res, 'auth/login', 'Sign In', 401, ['Invalid email or password.'], { email });
        }

        await regenerateSession(req);

        req.session.user = {
            id: user._id.toString(),
            displayName: user.displayName,
            username: user.username,
            email: user.email,
            role: user.role.name
        };

        return res.redirect(user.role.name === 'admin' ? '/admin' : '/');
    } catch (error) {
        return next(error);
    }
};

// POST /logout
const logout = async (req, res, next) => {
    try {
        await destroySession(req);
        res.clearCookie('connect.sid');
        return res.redirect('/');
    } catch (error) {
        return next(error);
    }
};

// GET /admin (admin role required)
const adminDashboardPage = (req, res) => {
    return res.render('admin/dashboard', { title: 'Admin Dashboard' });
};

export { registerPage, register, loginPage, login, logout, adminDashboardPage };
