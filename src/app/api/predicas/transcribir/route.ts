import { apiHandler } from '@/lib/api/handler';
import { transcribirAudioPredica } from '@/services/ia';

export const maxDuration = 60;

export const POST = apiHandler(
  async ({ user, json }) => transcribirAudioPredica(user, await json()),
  { requireAuth: true }
);
