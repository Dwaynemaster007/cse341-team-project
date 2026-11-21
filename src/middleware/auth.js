/**
 * Authentication and authorization middleware.
 *
 * loadSessionUser copies the signed-in user from the session to req.user (for
 * controllers and guards) and res.locals.user (for EJS templates). It does not
 * protect anything by itself.
 *
 * The guards come in two versions because pages and APIs need different responses:
 * - Page guards redirect to /login or show the 403 page.
 * - API guards return JSON with 401 or 403 so client-side fetch() code can react.
 */

const loadSessionUser = (req, res, next) => {
    req.user = req.session?.user || null;
    res.locals.user = req.user;
    next();
};

const isLoggedIn = (req) => {
    return Boolean(req.user);
};

const hasRole = (req, role) => {
    return req.user?.role === role;
};

const forbiddenPage = (res) => {
    return res.status(403).render('errors/403', { title: 'Access Denied' });
};

const requireApiLogin = (req, res, next) => {
    if (!isLoggedIn(req)) {
        return res.status(401).json({ message: 'Authentication required' });
    }
    return next();
};

const requirePageLogin = (req, res, next) => {
    if (!isLoggedIn(req)) {
        return res.redirect('/login');
    }
    return next();
};

const requireApiRole = (role) => {
    return (req, res, next) => {
        if (!isLoggedIn(req)) {
            return res.status(401).json({ message: 'Authentication required' });
        }
        if (!hasRole(req, role)) {
            return res.status(403).json({ message: 'Forbidden' });
        }
        return next();
    };
};

const requirePageRole = (role) => {
    return (req, res, next) => {
        if (!isLoggedIn(req)) {
            return res.redirect('/login');
        }
        if (!hasRole(req, role)) {
            return forbiddenPage(res);
        }
        return next();
    };
};

export {
    loadSessionUser,
    requireApiLogin,
    requirePageLogin,
    requireApiRole,
    requirePageRole
};
