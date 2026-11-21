import { apiHandler } from '@/lib/api/handler';
import { crearLeccion } from '@/services/cursos';

export const POST = apiHandler<{ id: string }>(
  async ({ user, params, json }) => crearLeccion(user, params.id, await json()),
  { requireAuth: true, status: 201 }
);
