import { apiHandler } from '@/lib/api/handler';
import { registrarReproduccionPredica } from '@/services/predicas';

export const POST = apiHandler<{ id: string }>(async ({ params }) =>
  registrarReproduccionPredica(params.id)
);
