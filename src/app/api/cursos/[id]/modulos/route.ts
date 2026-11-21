import { apiHandler } from '@/lib/api/handler';
import { crearModulo } from '@/services/cursos';

export const POST = apiHandler<{ id: string }>(
  async ({ user, params, json }) => crearModulo(user, params.id, await json()),
  { requireAuth: true, status: 201 }
);
