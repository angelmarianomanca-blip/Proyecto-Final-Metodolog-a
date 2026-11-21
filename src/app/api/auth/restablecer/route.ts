import { apiHandler } from '@/lib/api/handler';
import { restablecerPassword } from '@/services/auth';

export const POST = apiHandler(async ({ json }) => {
  const body = await json();
  return restablecerPassword(body);
});
