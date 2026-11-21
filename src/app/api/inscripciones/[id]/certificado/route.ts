import { NextResponse } from 'next/server';
import { apiHandler } from '@/lib/api/handler';
import { obtenerCertificadoPdf } from '@/services/inscripciones';

export const GET = apiHandler<{ id: string }>(
  async ({ user, params }) => {
    const { pdf, filename } = await obtenerCertificadoPdf(user, params.id);
    return new NextResponse(Buffer.from(pdf), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  },
  { requireAuth: true }
);
