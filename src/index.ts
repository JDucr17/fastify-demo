import Fastify from 'fastify';
import fastifyCors from '@fastify/cors';
import { getLoggerConfig, setupHealthCheckLogging } from './logging/index.js';
import { config } from './config/index.js';
import { onShutdown } from './server/shutdown.js';
import { db } from './db/config.js';
import { sql } from 'drizzle-orm';
import { errorHandler } from './middleware/error-handler.js';
import { authRoutes } from './auth/route.js';
import cursoRouter from './modules/curso/curso-routes.js';
import departamentoRouter from './modules/departamento/departamento-router.js';

const app = Fastify({
  logger: getLoggerConfig(),
  trustProxy: true
});

// Setup health check logging silencing
setupHealthCheckLogging(app);

// Register CORS plugin
await app.register(fastifyCors, {
  origin: config.clientUrl,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "X-Requested-With"
  ],
  credentials: true,
  maxAge: 86400
});

// Health checking routes
app.get('/health/livez', () => ({ status: 'ok' }));

app.get('/health/readyz', async (request, reply) => {
  try {
    await db.execute(sql`SELECT 1`);
    return { status: 'ok' };
  } catch {
    return reply.code(503).send({ status: 'unhealthy' });
  }
});

// Register auth routes
await app.register(authRoutes, { prefix: '/api' });

// Register module routes
await app.register(cursoRouter, { prefix: '/api' });
await app.register(departamentoRouter, { prefix: '/api' });

// Set glibal error handler
app.setErrorHandler(errorHandler);

// Start server
try {
  await app.listen({ 
    port: config.port, 
    host: config.host
  });
  app.log.info(`Server started on port ${config.port}`);
  onShutdown(app.server);
} catch (err) {
  app.log.error(err);
  process.exit(1);
}