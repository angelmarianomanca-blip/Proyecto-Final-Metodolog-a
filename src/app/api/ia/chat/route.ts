import { apiHandler } from '@/lib/api/handler';
import { consultarAsistenteIa } from '@/services/ia';

export const POST = apiHandler(
  async ({ user, json }) => consultarAsistenteIa(user, await json()),
  { requireAuth: true, status: 201 }
);
