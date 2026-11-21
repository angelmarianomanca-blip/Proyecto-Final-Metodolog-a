import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/auth/session';
import { listarConsultasForo } from '@/services/foros';
import { listarCursos } from '@/services/cursos';
import { formatFechaHora } from '@/lib/format';
import { CampusShell } from '@/components/campus-shell';
import {
  EmptyState,
  PageHeader,
  Pagination,
  Stack,
} from '@/components/primitives';
import { StatusBadge } from '@/components/ui/badge';
import { NuevaConsultaForoButton } from '@/components/foros-client';

export default async function ForosPage({
  searchParams,
}: {
  searchParams: Promise<{ cursoId?: string; estado?: string; q?: string; page?: string }>;
}) {
  const [user, sp] = await Promise.all([getSessionUser(), searchParams]);
  if (!user) redirect('/login');

  const [res, cursosRes] = await Promise.all([
    listarConsultasForo(user, sp),
    listarCursos(user, { page: '1', pageSize: '50' }),
  ]);

  return (
    <CampusShell user={user}>
      <Stack className="gap-6">
        <PageHeader
          eyebrow="Comunidad · RF-16"
          title="Foros Temáticos"
          description="Consultas académicas y pastorales asociadas a cada curso."
          action={<NuevaConsultaForoButton cursos={cursosRes.data} />}
        />

        <form
          action="/foros"
          className="flex flex-wrap gap-2 items-center"
        >
          <select
            name="cursoId"
            defaultValue={sp.cursoId ?? ''}
            className="px-3.5 py-2 rounded-full border border-[#D6CBB8] bg-white text-xs"
          >
            <option value="">Todos los cursos</option>
            {cursosRes.data.map((c) => (
              <option key={c.id} value={c.id}>
                {c.titulo}
              </option>
            ))}
          </select>
          <select
            name="estado"
            defaultValue={sp.estado ?? ''}
            className="px-3.5 py-2 rounded-full border border-[#D6CBB8] bg-white text-xs"
          >
            <option value="">Todos los estados</option>
            <option value="abierta">Abierta</option>
            <option value="respondida">Respondida</option>
            <option value="cerrada">Cerrada</option>
          </select>
          <button
            type="submit"
            className="px-4 py-2 rounded-full bg-[#241A13] text-white text-xs font-semibold cursor-pointer"
          >
            Filtrar
          </button>
        </form>

        {res.data.length === 0 ? (
          <EmptyState
            title="No hay consultas en este filtro"
            description="Publicá la primera consulta para iniciar el diálogo con docentes y alumnos."
          />
        ) : (
          <div className="space-y-3">
            {res.data.map((f) => (
              <div
                key={f.id}
                className="bg-white border border-[#E3DACB] rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-[#A46B29]"
              >
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge status={f.estado} />
                    <span className="text-xs font-semibold text-[#A46B29]">
                      {f.cursoTitulo}
                    </span>
                  </div>
                  <h2 className="text-base sm:text-lg font-bold">
                    {f.tituloConsulta}
                  </h2>
                  <div className="text-xs text-[#66584B]">
                    Por {f.autor} · {formatFechaHora(f.fechaCreacion)} ·{' '}
                    {f.totalRespuestas} respuestas
                  </div>
                </div>
                <Link
                  href={`/foros/${f.id}`}
                  className="shrink-0 px-4 py-2 rounded-full border border-[#241A13] text-xs font-semibold hover:bg-[#241A13] hover:text-white transition-colors text-center"
                >
                  Ver hilo
                </Link>
              </div>
            ))}
          </div>
        )}

        <Pagination
          page={res.page}
          pageSize={res.pageSize}
          total={res.total}
          basePath="/foros"
          extraParams={{ cursoId: sp.cursoId, estado: sp.estado }}
        />
      </Stack>
    </CampusShell>
  );
}
