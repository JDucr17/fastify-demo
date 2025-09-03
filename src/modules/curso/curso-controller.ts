import { CreateCursoSchema, IdParamSchema, PaginationSchema, UpdateCursoSchema } from './curso-validation.js';
import type { createCursoService } from './curso-service.js';
import type { FastifyReply, FastifyRequest } from 'fastify';
/**
 * Fastify passes request and reply type to all route handlers, but you only need to declare what you use:
 * So the controller methods should respect the following idea:
 * - No params: When just returning data (200 status auto-applied)
 * - FastifyRequest: When you need to access body, params, query, headers
 * - FastifyRequest + FastifyReply: When you need to set status codes (201, 204, etc.) or headers
 * 
 * Examples:
 * async getAll() { return data; }                    // No params needed
 * async getById(request: FastifyRequest) { ... }                     // Only need request
 * async create(request: FastifyRequest, reply: FastifyResponse) { reply.code(201) }   // Need both
 */
export const createCursoController = (cursoService: ReturnType<typeof createCursoService>) => ({
  
  async create(request: FastifyRequest, reply: FastifyReply) {
    const data = CreateCursoSchema.parse(request.body);
    const result = await cursoService.createCurso(data);
    return reply.code(201).send(result);
  },

  async getAll() {
    const result = await cursoService.getAllCursos();
    return result; 
  },

  async getPaginated(request: FastifyRequest) {
    const params = PaginationSchema.parse(request.query);
    const result = await cursoService.getCursosPaginated(params);
    return result;
  },

  async update(request: FastifyRequest) {
    const { id } = IdParamSchema.parse(request.params);
    const data = UpdateCursoSchema.parse(request.body);
    const updated = await cursoService.updateCurso(id, data);
    return updated;
  },

  async delete(request: FastifyRequest, reply: FastifyReply) {
    const { id } = IdParamSchema.parse(request.params);
    await cursoService.deleteCurso(id);
    return reply.code(204).send();
  },
});