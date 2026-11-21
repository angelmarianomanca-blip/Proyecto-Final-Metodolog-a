import Link from 'next/link';
import { Headphones, Search } from 'lucide-react';
import { getSessionUser } from '@/lib/auth/session';
import { listarPredicas } from '@/services/predicas';
import { formatFecha } from '@/lib/format';
import { PublicShell } from '@/components/public-shell';
import {
  EmptyState,
  PageHeader,
  Pagination,
  Stack,
} from '@/components/primitives';

export default async function PredicasPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    predicador?: string;
    pasaje?: string;
    desde?: string;
    hasta?: string;
    page?: string;
  }>;
}) {
  const [user, sp] = await Promise.all([getSessionUser(), searchParams]);
  const res = await listarPredicas(sp);

  return (
    <PublicShell user={user}>
      <Stack className="gap-6">
        <PageHeader
          dark
          eyebrow="Repositorio Público"
          title="Prédicas y Estudios Bíblicos"
          description="Escuchá las predicaciones y leé su transcripción 1:1 en simultáneo."
        />

        <form
          action="/predicas"
          className="bg-white border border-[#E3DACB] rounded-2xl p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3"
        >
          <div className="lg:col-span-2 relative">
            <Search className="w-4 h-4 text-[#66584B] absolute left-3.5 top-2.5" />
            <input
              type="text"
              name="q"
              defaultValue={sp.q ?? ''}
              placeholder="Tema, texto o pasaje (ej. gracia, 2 Corintios)..."
              className="w-full pl-9 pr-3 py-2 rounded-full border border-[#D6CBB8] text-sm"
            />
          </div>
          <input
            type="text"
            name="predicador"
            defaultValue={sp.predicador ?? ''}
            placeholder="Predicador..."
            className="px-3.5 py-2 rounded-full border border-[#D6CBB8] text-sm"
          />
          <input
            type="date"
            name="desde"
            defaultValue={sp.desde ?? ''}
            className="px-3 py-2 rounded-full border border-[#D6CBB8] text-sm"
            title="Desde"
          />
          <button
            type="submit"
            className="px-4 py-2 rounded-full bg-[#241A13] text-white text-xs font-semibold uppercase tracking-wider hover:bg-[#A46B29] cursor-pointer"
          >
            Filtrar
          </button>
        </form>

        {res.data.length === 0 ? (
          <EmptyState
            title="No encontramos prédicas con esos filtros"
            description="Limpiá los filtros para ver todo el repositorio de prédicas y estudios bíblicos."
            action={
              <Link
                href="/predicas"
                className="px-5 py-2 rounded-full bg-[#A46B29] text-white text-xs font-semibold"
              >
                Ver todas las prédicas
              </Link>
            }
          />
        ) : (
          <div className="space-y-3">
            {res.data.map((p) => (
              <div
                key={p.id}
                className="bg-white border border-[#E3DACB] rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-[#A46B29] transition-colors"
              >
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-[#F8EFE2] text-[#7C4F1D] border border-[#E4CCA8] text-xs font-semibold">
                      {p.pasajeBiblico}
                    </span>
                    <span className="text-xs text-[#66584B]">
                      {formatFecha(p.fechaPredica)}
                    </span>
                    {p.tieneTranscripcion && (
                      <span className="text-xs text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full">
                        Transcripción 1:1
                      </span>
                    )}
                  </div>
                  <h2 className="text-lg font-bold">{p.titulo}</h2>
                  <div className="text-xs text-[#66584B]">
                    {p.predicador} · {p.reproducciones} reproducciones
                  </div>
                </div>
                <Link
                  href={`/predicas/${p.id}`}
                  className="shrink-0 px-4 py-2 rounded-full bg-[#A46B29] text-white text-xs font-semibold flex items-center justify-center gap-2 hover:bg-[#88561D]"
                >
                  <Headphones className="w-4 h-4" />
                  <span>Reproducir y leer</span>
                </Link>
              </div>
            ))}
          </div>
        )}

        <Pagination
          page={res.page}
          pageSize={res.pageSize}
          total={res.total}
          basePath="/predicas"
          extraParams={{ q: sp.q, predicador: sp.predicador, desde: sp.desde }}
        />
      </Stack>
    </PublicShell>
  );
}
