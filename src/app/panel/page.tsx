import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/auth/session';
import { obtenerDatosTablero } from '@/services/tablero';
import { CampusShell } from '@/components/campus-shell';
import { PageHeader, Stack } from '@/components/primitives';
import { Card, CardContent } from '@/components/ui/card';
import { TableroCharts } from '@/components/tablero-charts';

export default async function PanelPage() {
  const user = await getSessionUser();
  if (!user) redirect('/login');
  if (user.rol !== 'admin' && user.rol !== 'profesor') {
    redirect('/mi-aprendizaje');
  }

  const data = await obtenerDatosTablero(user, 7);
  const r = data.resumen;

  const kpis = [
    { label: 'Alumnos activos', val: r.alumnosActivos },
    { label: 'Cursos publicados', val: r.cursosPublicados },
    { label: 'Inscripciones totales', val: r.inscripcionesTotales },
    { label: 'Cursos finalizados', val: r.cursosFinalizados },
    { label: 'Tasa avance promedio', val: `${r.tasaAvancePromedio}%` },
    { label: 'Reproducciones prédicas', val: r.reproduccionesTotales },
    { label: 'Consultas foro abiertas', val: r.consultasForoAbiertas },
    { label: 'Utilidad Asistente IA', val: `${r.tasaUtilidadIa}%` },
  ];

  return (
    <CampusShell user={user}>
      <Stack className="gap-6">
        <PageHeader
          eyebrow="Estadísticas · RF-23, CA-06"
          title="Tablero Directivo y Métricas de Uso"
          description="Indicadores en vivo calculados sobre la base de datos relacional."
        />

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {kpis.map((k) => (
            <Card key={k.label}>
              <CardContent className="p-4">
                <div className="text-xs text-[#66584B]">{k.label}</div>
                <div className="text-2xl font-bold text-[#241A13] mt-1">
                  {k.val}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <TableroCharts
          avancePorCurso={data.avancePorCurso}
          actividadSemanal={data.actividadSemanal}
          predicasMasEscuchadas={data.predicasMasEscuchadas}
        />
      </Stack>
    </CampusShell>
  );
}
