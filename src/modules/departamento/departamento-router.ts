import type { FastifyInstance } from 'fastify';
import { createDepartamentoRepository } from './departamento-repository.js';
import { createDepartamentoService } from './departamento-service.js';
import { createDepartamentoController } from './departamento-controller.js';
import { db } from '../../db/config.js';

export default function departamentoRoutes(app: FastifyInstance) {
  const departamentoRepo = createDepartamentoRepository(db);
  const departamentoService = createDepartamentoService({ departamentoRepo });
  const departamentoController = createDepartamentoController(departamentoService);

  app.get('/departamentos', departamentoController.getAll);
}