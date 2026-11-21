import { apiHandler } from '@/lib/api/handler';
import { crearPredica, listarPredicas } from '@/services/predicas';

export const GET = apiHandler(async ({ searchParams }) =>
  listarPredicas({
    q: searchParams.get('q') ?? undefined,
    predicador: searchParams.get('predicador') ?? undefined,
    pasaje: searchParams.get('pasaje') ?? undefined,
    desde: searchParams.get('desde') ?? undefined,
    hasta: searchParams.get('hasta') ?? undefined,
    page: searchParams.get('page') ?? undefined,
    pageSize: searchParams.get('pageSize') ?? undefined,
  })
);

export const POST = apiHandler(
  async ({ user, json }) => crearPredica(user, await json()),
  { requireAuth: true, status: 201 }
);
