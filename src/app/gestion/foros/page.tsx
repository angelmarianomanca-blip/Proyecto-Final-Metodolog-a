import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/auth/session';
import { listarConsultasForo } from '@/services/foros';
import { formatFechaHora } from '@/lib/format';
import { CampusShell } from '@/components/campus-shell';
import { PageHeader, Stack } from '@/components/primitives';
import { StatusBadge } from '@/components/ui/badge';

export default async function GestionForosPage() {
  const user = await getSessionUser();
  if (!user) redirect('/login');
  if (user.rol !== 'admin' && user.rol !== 'profesor') {
    redirect('/mi-aprendizaje');
  }

  const res = await listarConsultasForo(user, { page: '1', pageSize: '50' });
  const ordenadas = [...res.data].sort((a, b) => {
    const rank = (e: string) => (e === 'abierta' ? 0 : e === 'respondida' ? 1 : 2);
    return rank(a.estado) - rank(b.estado);
  });

  return (
    <CampusShell user={user}>
      <Stack className="gap-6">
        <PageHeader
          eyebrow="Moderación Docente · RF-17, RN-10"
          title="Moderación de Foros"
          description="Consultas abiertas priorizadas para respuesta pastoral, cierre o moderación."
        />

        <div className="bg-white border border-[#E3DACB] rounded-2xl overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-[#241A13] text-white text-xs">
              <tr>
                <th className="p-4">Consulta</th>
                <th className="p-4">Alumno</th>
                <th className="p-4">Estado</th>
                <th className="p-4 text-right">Moderación</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E3DACB]">
              {ordenadas.map((f) => (
                <tr key={f.id}>
                  <td className="p-4">
                    <div className="font-semibold">{f.tituloConsulta}</div>
                    <div className="text-xs text-[#66584B]">
                      {f.cursoTitulo} · {formatFechaHora(f.fechaCreacion)}
                    </div>
                  </td>
                  <td className="p-4 text-xs">{f.autor}</td>
                  <td className="p-4">
                    <StatusBadge status={f.estado} />
                  </td>
                  <td className="p-4 text-right whitespace-nowrap">
                    <Link
                      href={`/foros/${f.id}`}
                      className="px-3.5 py-1.5 rounded-full bg-[#241A13] text-white text-xs font-semibold hover:bg-[#A46B29]"
                    >
                      Moderar / Responder
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Stack>
    </CampusShell>
  );
}
