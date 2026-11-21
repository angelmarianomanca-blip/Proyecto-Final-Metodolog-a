import { apiHandler } from '@/lib/api/handler';
import { editarCurso, obtenerCursoDetalle } from '@/services/cursos';

export const GET = apiHandler<{ id: string }>(
  async ({ user, params, searchParams }) =>
    obtenerCursoDetalle(
      user,
      params.id,
      searchParams.get('incluirInactivas') === 'true'
    )
);

export const PATCH = apiHandler<{ id: string }>(
  async ({ user, params, json }) => editarCurso(user, params.id, await json()),
  { requireAuth: true }
);
