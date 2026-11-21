import { apiHandler } from '@/lib/api/handler';
import { editarLeccion } from '@/services/cursos';

export const PATCH = apiHandler<{ id: string }>(
  async ({ user, params, json }) => editarLeccion(user, params.id, await json()),
  { requireAuth: true }
);
