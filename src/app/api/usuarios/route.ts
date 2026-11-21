import { apiHandler } from '@/lib/api/handler';
import { crearUsuarioAdmin, listarUsuarios } from '@/services/usuarios';

export const GET = apiHandler(
  async ({ user, searchParams }) =>
    listarUsuarios(user, {
      q: searchParams.get('q') ?? undefined,
      rol: searchParams.get('rol') ?? undefined,
      activo: searchParams.get('activo') ?? undefined,
      page: searchParams.get('page') ?? undefined,
      pageSize: searchParams.get('pageSize') ?? undefined,
    }),
  { requireAuth: true }
);

export const POST = apiHandler(
  async ({ user, json }) => crearUsuarioAdmin(user, await json()),
  { requireAuth: true, status: 201 }
);
