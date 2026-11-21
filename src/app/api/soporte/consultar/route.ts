import { apiHandler } from '@/lib/api/handler';
import { consultarBotGuia } from '@/services/soporte';

export const POST = apiHandler(async ({ json }) =>
  consultarBotGuia(await json())
);
