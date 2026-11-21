import { apiHandler } from '@/lib/api/handler';
import { actualizarProgresoLeccion } from '@/services/inscripciones';

export const PATCH = apiHandler<{ id: string; leccionId: string }>(
  async ({ user, params, json }) =>
    actualizarProgresoLeccion(user, params.id, params.leccionId, await json()),
  { requireAuth: true }
);
