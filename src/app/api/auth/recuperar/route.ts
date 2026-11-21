import { apiHandler } from '@/lib/api/handler';
import { solicitarRecuperacionPassword } from '@/services/auth';

export const POST = apiHandler(async ({ json }) => {
  const body = await json();
  return solicitarRecuperacionPassword(body);
});
