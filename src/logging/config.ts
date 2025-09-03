import type { FastifyServerOptions, FastifyInstance } from 'fastify';
import { config } from '../config/index.js';

export function getLoggerConfig(): FastifyServerOptions['logger'] {
  return {
    level: config.logLevel,
    
    // Redacting sensitive data
    redact: {
      paths: [
        'req.headers.authorization',
        'req.headers.cookie',
        'res.headers["set-cookie"]',
        '*.password',
        '*.email',
        '*.token',
        '*.apiKey',
      ],
      remove: true
    },
    
    serializers: {
      req: (req) => ({
        method: req.method,
        url: req.url,
        ...(req.method === 'POST' && { 
          contentLength: req.headers['content-length'] 
        }),
      }),
      res: (res) => ({
        statusCode: res.statusCode,
      })
    },
    
    // Pretty printing in development
    ...(config.isDevelopment && {
      transport: {
        target: 'pino-pretty',
        options: {
          colorize: true,
          ignore: 'pid,hostname',
          translateTime: 'HH:MM:ss Z',
        }
      }
    })
  };
}

// Logging disabled for health check routes
export function setupHealthCheckLogging(app: FastifyInstance) {
  app.addHook('onRoute', (routeOptions) => {
    if (routeOptions.url?.includes('/health')) {
      routeOptions.logLevel = 'silent';
    }
  });
}