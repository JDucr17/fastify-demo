import { createCursoRepository } from './curso-repository.js';
import { createCursoService } from './curso-service.js';
import { createCursoController } from './curso-controller.js';
import { db } from '../../db/config.js';
import type { FastifyInstance } from 'fastify';

export default function cursoRoutes(app: FastifyInstance) {
  // Instantiate dependencies
  const cursoRepo = createCursoRepository(db);
  const cursoService = createCursoService({ cursoRepo });
  const cursoController = createCursoController(cursoService);

  // Routes
  app.post('/cursos', cursoController.create);
  app.get('/cursos', cursoController.getAll);
  app.get('/cursos/paginated', cursoController.getPaginated);
  app.put('/cursos/:id', cursoController.update);
  app.delete('/cursos/:id', cursoController.delete);
}