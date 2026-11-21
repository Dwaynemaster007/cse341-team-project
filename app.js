import express from 'express';
import session from 'express-session';
import Path from 'path';
import { fileURLToPath } from 'url';
import pkg from './package.json' with { type: 'json' };
import globalMiddleware from './src/middleware/global.js';
import { loadSessionUser } from './src/middleware/auth.js';
import routes from './src/routes/router.js';
import swaggerUi from 'swagger-ui-express';
import swaggerSpec from './src/swagger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = Path.dirname(__filename);

const SESSION_SECRET = process.env.SESSION_SECRET;
const IS_PRODUCTION = (process.env.NODE_ENV || 'production').toLowerCase().includes('prod');

if (!SESSION_SECRET) {
    throw new Error('SESSION_SECRET is required. Add it to your .env file (and to Render).');
}

const app = express();

// Render serves the app over HTTPS through a proxy; trust it so secure cookies work.
app.set('trust proxy', 1);

// Add version info to res.locals for access in templates.
app.use((req, res, next) => {
    res.locals.appVersion = pkg.version;
    next();
});

// Configure static files and EJS templates.
app.use(express.static(Path.join(__dirname, 'public')));
app.set('view engine', 'ejs');
app.set('views', Path.join(__dirname, 'src/views'));

// Parse JSON and URL-encoded request bodies.
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use(globalMiddleware);

// Session management: must be registered before any route that reads req.session.
app.use(session({
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    rolling: true,
    cookie: {
        httpOnly: true,
        sameSite: 'lax',
        secure: IS_PRODUCTION,
        maxAge: 60 * 60 * 1000 // 1 hour of inactivity
    }
}));

// Make the signed-in user available as req.user and in every EJS template.
app.use(loadSessionUser);

// Interactive API documentation generated from src/routes/api-routes.js.
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use('/', routes);

// Catch requests that did not match a route.
app.use((req, res, next) => {
    const err = new Error('Page Not Found');
    err.status = 404;
    next(err);
});

// Render the appropriate error page.
app.use((err, req, res, next) => {
    const status = err.status || 500;
    const templates = { 403: '403', 404: '404' };
    const titles = { 403: 'Access Denied', 404: 'Page Not Found' };
    const template = templates[status] || '500';
    const context = {
        title: titles[status] || 'Server Error',
        error: err.message,
        stack: err.stack
    };

    return res.status(status).render(`errors/${template}`, context);
});

export default app;
