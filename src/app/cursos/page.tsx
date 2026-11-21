import Link from 'next/link';
import { Search } from 'lucide-react';
import { getSessionUser } from '@/lib/auth/session';
import { listarCursos } from '@/services/cursos';
import { PublicShell } from '@/components/public-shell';
import {
  EmptyState,
  Grid,
  PageHeader,
  Pagination,
  Stack,
} from '@/components/primitives';
import { Card, CardContent, CardFooter } from '@/components/ui/card';

export default async function CursosPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const [user, sp] = await Promise.all([getSessionUser(), searchParams]);
  const res = await listarCursos(user, { q: sp.q, page: sp.page });

  return (
    <PublicShell user={user}>
      <Stack className="gap-6">
        <PageHeader
          dark
          eyebrow="Catálogo Público · RF-07"
          title="Cursos de Formación Teológica"
          description="Acceso 100% gratuito y asincrónico a cursos publicados (RN-06, RN-11)."
          action={
            <form action="/cursos" className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-[#D6CBB8] absolute left-3.5 top-2.5" />
              <input
                type="text"
                name="q"
                defaultValue={sp.q ?? ''}
                placeholder="Buscar curso o profesor..."
                className="w-full pl-9 pr-4 py-2 rounded-full border border-white/25 bg-white/10 text-white placeholder-[#D6CBB8] text-sm focus:outline-none focus:border-[#A46B29]"
              />
            </form>
          }
        />

        {res.data.length === 0 ? (
          <EmptyState
            title="No encontramos cursos con esa búsqueda"
            description="Probá limpiando el filtro para explorar todos los cursos publicados."
            action={
              <Link
                href="/cursos"
                className="px-5 py-2 rounded-full bg-[#A46B29] text-white text-xs font-semibold"
              >
                Ver todos los cursos
              </Link>
            }
          />
        ) : (
          <Grid>
            {res.data.map((c) => (
              <Card
                key={c.id}
                className="flex flex-col justify-between hover:border-[#A46B29] transition-colors"
              >
                <CardContent className="p-6 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold px-3 py-0.5 rounded-full bg-[#FAF7F1] text-[#241A13] border border-[#E3DACB]">
                      Docente: {c.profesor}
                    </span>
                    <span className="text-xs font-semibold text-emerald-700">
                      100% Gratuito
                    </span>
                  </div>
                  <h2 className="text-xl font-bold">{c.titulo}</h2>
                  <p className="text-sm text-[#66584B] leading-relaxed">
                    {c.descripcion}
                  </p>
                </CardContent>
                <CardFooter>
                  <span className="text-xs text-[#66584B]">
                    {c.totalModulos} módulos · {c.totalLecciones} lecciones ·{' '}
                    {c.totalInscriptos} alumnos
                  </span>
                  <Link
                    href={`/cursos/${c.id}`}
                    className="px-4 py-2 rounded-full bg-[#A46B29] text-white text-xs font-semibold hover:bg-[#88561D]"
                  >
                    Ver detalle e inscribirme
                  </Link>
                </CardFooter>
              </Card>
            ))}
          </Grid>
        )}

        <Pagination
          page={res.page}
          pageSize={res.pageSize}
          total={res.total}
          basePath="/cursos"
          extraParams={{ q: sp.q }}
        />
      </Stack>
    </PublicShell>
  );
}
