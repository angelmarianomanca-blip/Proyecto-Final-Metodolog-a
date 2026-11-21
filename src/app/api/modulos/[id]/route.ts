import { apiHandler } from '@/lib/api/handler';
import { editarModulo, eliminarModulo } from '@/services/cursos';

export const PATCH = apiHandler<{ id: string }>(
  async ({ user, params, json }) => editarModulo(user, params.id, await json()),
  { requireAuth: true }
);

export const DELETE = apiHandler<{ id: string }>(
  async ({ user, params }) => eliminarModulo(user, params.id),
  { requireAuth: true }
);
