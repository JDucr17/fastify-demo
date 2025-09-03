import type { FastifyError, FastifyReply, FastifyRequest } from 'fastify';
import { ZodError } from 'zod';
import { DatabaseError } from 'pg';
import { isAppError, type AppError } from '../shared/app-errors.js';
import { mapDatabaseError } from '../shared/db-errors.js';
import { config } from '../config/index.js';

interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

function sendError(
  reply: FastifyReply,
  status: number,
  code: string,
  message: string,
  details?: unknown
): void {
  const response: ErrorResponse = {
    error: { code, message },
  };

  if (details !== undefined) {
    response.error.details = details;
  }
  
  reply.code(status).send(response);
}

// Handle Zod validation errors
function handleValidationError(err: ZodError, request: FastifyRequest, reply: FastifyReply) {
  request.log.info(
    {
      type: 'validation_error',
      method: request.method,
      path: request.url,
      issues: err.issues,
    },
    'Validation failed'
  );

  const details = err.issues.map((issue) => ({
    field: issue.path.join('.'),
    message: issue.message,
  }));

  sendError(reply, 400, 'VALIDATION_ERROR', 'Datos inválidos', details);
}

// Handle database errors
function handleDatabaseError(err: DatabaseError, request: FastifyRequest, reply: FastifyReply) {
  const mapped = mapDatabaseError(err);

  if (mapped) {
    request.log.warn(
      {
        type: 'database_error',
        code: err.code,
        detail: err.detail,
        method: request.method,
        path: request.url,
      },
      `Database error: ${mapped.message}`
    );

    sendError(reply, mapped.status, mapped.code, mapped.message);
    return;
  }

  request.log.error(
    {
      type: 'unmapped_database_error',
      code: err.code,
      message: err.message,
      detail: err.detail,
      method: request.method,
      path: request.url,
    },
    'Unmapped database error encountered'
  );

  sendError(reply, 500, 'DATABASE_ERROR', 'Error en la base de datos');
}

// Handle application errors
function handleAppError(err: AppError, request: FastifyRequest, reply: FastifyReply) {
  const logLevel = err.statusCode >= 500 ? 'error' : 'info';

  request.log[logLevel](
    {
      type: 'app_error',
      code: err.code,
      statusCode: err.statusCode,
      method: request.method,
      path: request.url,
    },
    err.message
  );

  sendError(reply, err.statusCode, err.code, err.message);
}

// Handle unknown errors
function handleUnknownError(err: unknown, request: FastifyRequest, reply: FastifyReply) {
  request.log.error(
    {
      type: 'unhandled_error',
      method: request.method,
      path: request.url,
      error:
        err instanceof Error
          ? {
              name: err.name,
              message: err.message,
              stack: err.stack,
            }
          : err,
    },
    'Unhandled error in request'
  );

  const message =
    config.isDevelopment && err instanceof Error ? err.message : 'Error interno del servidor';

  sendError(reply, 500, 'INTERNAL_ERROR', message);
}

// Global Error Handler
export function errorHandler(
  error: FastifyError | Error,
  request: FastifyRequest,
  reply: FastifyReply
): void {
  // Check if its a validation error
  if (error instanceof ZodError) {
    return handleValidationError(error, request, reply);
  }
  
  // Check if its a database error
  if (error instanceof DatabaseError) {
    return handleDatabaseError(error, request, reply);
  }
  
  // Check if its an application error
  if (isAppError(error)) {
    return handleAppError(error, request, reply);
  }

  // Unknown error handler
  handleUnknownError(error, request, reply);
}