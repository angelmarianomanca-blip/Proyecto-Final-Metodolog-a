import { apiHandler } from '@/lib/api/handler';
import { editarPredica, obtenerPredicaDetalle } from '@/services/predicas';

export const GET = apiHandler<{ id: string }>(async ({ params }) =>
  obtenerPredicaDetalle(params.id)
);

export const PATCH = apiHandler<{ id: string }>(
  async ({ user, params, json }) => editarPredica(user, params.id, await json()),
  { requireAuth: true }
);
