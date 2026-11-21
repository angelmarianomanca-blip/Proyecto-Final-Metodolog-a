'use client';

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar, Line } from 'react-chartjs-2';
import { Card, CardContent } from '@/components/ui/card';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

export function TableroCharts({
  avancePorCurso,
  actividadSemanal,
  predicasMasEscuchadas,
}: {
  avancePorCurso: Array<{
    cursoId: number;
    titulo: string;
    inscriptos: number;
    finalizados: number;
    porcentajePromedio: number;
  }>;
  actividadSemanal: Array<{
    etiqueta: string;
    inscripciones: number;
    foros: number;
    ia: number;
  }>;
  predicasMasEscuchadas: Array<{
    id: number;
    titulo: string;
    reproducciones: number;
  }>;
}) {
  const cursosData = {
    labels: avancePorCurso.map((c) =>
      c.titulo.length > 26 ? `${c.titulo.slice(0, 26)}…` : c.titulo
    ),
    datasets: [
      {
        label: 'Inscriptos',
        data: avancePorCurso.map((c) => c.inscriptos),
        backgroundColor: '#241A13',
        borderRadius: 6,
      },
      {
        label: 'Finalizados',
        data: avancePorCurso.map((c) => c.finalizados),
        backgroundColor: '#A46B29',
        borderRadius: 6,
      },
    ],
  };

  const semanalData = {
    labels: actividadSemanal.map((d) => d.etiqueta),
    datasets: [
      {
        label: 'Consultas IA',
        data: actividadSemanal.map((d) => d.ia),
        borderColor: '#A46B29',
        backgroundColor: '#A46B29',
        tension: 0.3,
      },
      {
        label: 'Inscripciones',
        data: actividadSemanal.map((d) => d.inscripciones),
        borderColor: '#241A13',
        backgroundColor: '#241A13',
        tension: 0.3,
      },
      {
        label: 'Foros',
        data: actividadSemanal.map((d) => d.foros),
        borderColor: '#15803D',
        backgroundColor: '#15803D',
        tension: 0.3,
      },
    ],
  };

  const predicasData = {
    labels: predicasMasEscuchadas.map((p) =>
      p.titulo.length > 32 ? `${p.titulo.slice(0, 32)}…` : p.titulo
    ),
    datasets: [
      {
        label: 'Reproducciones',
        data: predicasMasEscuchadas.map((p) => p.reproducciones),
        backgroundColor: '#A46B29',
        borderRadius: 6,
      },
    ],
  };

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Card>
          <CardContent className="p-5 space-y-3">
            <h2 className="font-bold text-sm">
              Avance e inscripciones por curso
            </h2>
            <div className="h-60">
              <Bar
                data={cursosData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: { legend: { position: 'top' } },
                }}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5 space-y-3">
            <h2 className="font-bold text-sm">
              Actividad semanal (Inscripciones / Foros / IA)
            </h2>
            <div className="h-60">
              <Line
                data={semanalData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: { legend: { position: 'top' } },
                }}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-5 space-y-3">
          <h2 className="font-bold text-sm">Top 5 prédicas más escuchadas</h2>
          <div className="h-56">
            <Bar
              data={predicasData}
              options={{
                indexAxis: 'y',
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
              }}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
