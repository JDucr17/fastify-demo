import type { createDepartamentoService } from './departamento-service.js';

export const createDepartamentoController = (
  departamentoService: ReturnType<typeof createDepartamentoService>
) => ({
  async getAll() {
    const result = await departamentoService.getAllDepartamentos();
    return result; 
  },
});