import { apiHandler } from '@/lib/api/handler';
import { crearCurso, listarCursos } from '@/services/cursos';

export const GET = apiHandler(async ({ user, searchParams }) =>
  listarCursos(user, {
    q: searchParams.get('q') ?? undefined,
    estado: searchParams.get('estado') ?? undefined,
    gestion: searchParams.get('gestion') ?? undefined,
    page: searchParams.get('page') ?? undefined,
    pageSize: searchParams.get('pageSize') ?? undefined,
  })
);

export const POST = apiHandler(
  async ({ user, json }) => crearCurso(user, await json()),
  { requireAuth: true, status: 201 }
);
