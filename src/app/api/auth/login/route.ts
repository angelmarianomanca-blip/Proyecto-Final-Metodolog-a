import { apiHandler } from '@/lib/api/handler';
import { setSessionCookie } from '@/lib/auth/session';
import { autenticarUsuario } from '@/services/auth';

export const POST = apiHandler(async ({ json }) => {
  const body = await json();
  const user = await autenticarUsuario(body);
  await setSessionCookie(user.id);
  return { user };
});
