/**
 * Domain types for Curso module
 * These represent the data contracts as stored in the database
 * These types are used in the repository layer to guarantee type safe operations
 */

export interface CursoData {
  id: number;
  sigla: string;
  nombre: string;
  idDepartamento: number;
  creditaje: number | null;
  horas: number;
  activo: boolean;
}

export interface DepartamentoData {
  id: number;
  nombre: string;
}

export interface CursoWithDepartamento extends CursoData {
  departamento: DepartamentoData;
}

export type CreateCursoData = Omit<CursoData, 'id'>;

export type UpdateCursoData = Partial<Omit<CursoData, 'id'>>;
