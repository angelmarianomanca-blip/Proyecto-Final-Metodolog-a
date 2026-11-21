import { apiHandler } from '@/lib/api/handler';
import { crearConsultaForo, listarConsultasForo } from '@/services/foros';

export const GET = apiHandler(
  async ({ user, searchParams }) =>
    listarConsultasForo(user, {
      cursoId: searchParams.get('cursoId') ?? undefined,
      estado: searchParams.get('estado') ?? undefined,
      q: searchParams.get('q') ?? undefined,
      page: searchParams.get('page') ?? undefined,
      pageSize: searchParams.get('pageSize') ?? undefined,
    }),
  { requireAuth: true }
);

export const POST = apiHandler(
  async ({ user, json }) => crearConsultaForo(user, await json()),
  { requireAuth: true, status: 201 }
);
