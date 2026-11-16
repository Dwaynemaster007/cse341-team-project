import Path from 'path';
import { fileURLToPath } from 'url';
import swaggerJsdoc from 'swagger-jsdoc';

const __dirname = Path.dirname(fileURLToPath(import.meta.url));

/**
 * The OpenAPI document is generated from the @openapi comments in api-routes.js
 * every time the app starts, so there is no generated swagger.json file to keep
 * in sync or to cause merge conflicts between teammates.
 */
const swaggerSpec = swaggerJsdoc({
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Kizuna Rail API',
      version: '1.0.0',
      description: 'JSON API for the Kizuna Rail scenic railway booking site'
    },
    servers: [
      {
        url: '/',
        description: 'Current server'
      }
    ]
  },
  apis: [Path.join(__dirname, 'routes', 'api-routes.js')]
});

export default swaggerSpec;
