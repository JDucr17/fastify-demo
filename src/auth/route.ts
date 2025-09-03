import { auth } from './auth.js';
import type { FastifyInstance, FastifyPluginOptions, FastifyRequest, FastifyReply } from 'fastify';

const METHODS_WITHOUT_BODY = ['GET', 'HEAD', 'OPTIONS'];
const HEADERS_TO_EXCLUDE = ['host', 'content-length', 'connection'];

/**
 * Convert Fastify request to Fetch API Request for Better Auth
 */
function createAuthRequest(request: FastifyRequest): Request | null {
  const host = request.headers.host;
  if (!host) return null;

  const url = new URL(request.url, `${request.protocol}://${host}`);
  
  const headers = new Headers();
  
  // Build headers, excluding ones that will be recomputed
  Object.entries(request.headers).forEach(([key, value]) => {
    if (HEADERS_TO_EXCLUDE.includes(key.toLowerCase())) return;

    if (Array.isArray(value)) {
      value.forEach(v => headers.append(key, String(v)));
    } else if (value) {
      headers.set(key, String(value));
    }
  });

  const requestInit: RequestInit = {
    method: request.method,
    headers,
  };

  // Add body for non-GET/HEAD/OPTIONS
  if (!METHODS_WITHOUT_BODY.includes(request.method) && request.body) {
    requestInit.body = JSON.stringify(request.body);
    
    // Ensure Content-Type is set for JSON bodies
    if (!headers.has('content-type')) {
      headers.set('content-type', 'application/json');
    }
  }

  return new Request(url.toString(), requestInit);
}

/**
 * Forward Better Auth response headers to Fastify reply
 */
function forwardResponseHeaders(response: Response, reply: FastifyReply): void {
  for (const [key, value] of response.headers) {
    const lowerKey = key.toLowerCase();
    
    if (lowerKey === 'set-cookie') {
      const cookies = response.headers.getSetCookie?.() || [value];
      for (const cookie of cookies) {
        reply.header('Set-Cookie', cookie);
      }
    } else if (lowerKey !== 'content-length') {
      reply.header(key, value);
    }
  }
}

/**
 * Process and send response body based on content type
 */
async function sendResponseBody(response: Response, reply: FastifyReply): Promise<void> {
  if (!response.body) {
    reply.send();
    return;
  }

  const contentType = response.headers.get('content-type');
  if (contentType?.includes('application/json')) {
    const json = await response.json();
    reply.send(json);
  } else {
    const text = await response.text();
    reply.send(text);
  }
}

/**
 * Better Auth Fastify integration - manual catch-all route for auth
 */
export function authRoutes(app: FastifyInstance, _options: FastifyPluginOptions): void {
  app.route({
    method: ['GET', 'POST', 'OPTIONS'],
    url: '/auth/*',
    handler(request: FastifyRequest, reply: FastifyReply) {
      const authRequest = createAuthRequest(request);
      if (!authRequest) {
        return reply.code(400).send({ 
          error: 'Missing host header',
          code: 'INVALID_REQUEST'
        });
      }

      // Return the promise to properly handle async operations
      return auth.handler(authRequest)
        .then(response => {
          reply.code(response.status);
          forwardResponseHeaders(response, reply);
          return sendResponseBody(response, reply);
        })
        .catch(error => {
          request.log.error(
            { err: error, path: request.url },
            'Better Auth handler failed'
          );
          throw error;
        });
    }
  });

  app.get('/auth/health', () => ({ 
    status: 'healthy', 
    service: 'auth' 
  }));
}