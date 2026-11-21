import { apiHandler } from '@/lib/api/handler';
import { crearEntradaSoporte, listarBaseSoporte } from '@/services/soporte';

export const GET = apiHandler(async () => listarBaseSoporte());

export const POST = apiHandler(
  async ({ user, json }) => crearEntradaSoporte(user, await json()),
  { requireAuth: true, status: 201 }
);
