import Link from 'next/link';
import { Heart } from 'lucide-react';
import { getSessionUser } from '@/lib/auth/session';
import { listarInformacionInstitucional } from '@/services/institucional';
import { LABELS_TIPO_INSTITUCIONAL } from '@/lib/constants';
import { formatFecha } from '@/lib/format';
import { PublicShell } from '@/components/public-shell';
import { ScrollGrowObserver } from '@/components/scroll-grow';

const SHADES = ['#9C6426', '#784B1D', '#543415', '#311F10'];

const VERSICULOS: Record<string, { verso: string; vivencia: string }> = {
  declaracion_fe: {
    verso:
      '«Toda la Escritura es inspirada por Dios, y útil para enseñar, para redargüir, para corregir, para instruir en justicia.» — 2 Timoteo 3:16',
    vivencia:
      'Cada clase, guía y conversación en la plataforma parte de esta convicción: la Escritura tiene la última palabra y nos apunta siempre a Cristo.',
  },
  doctrina: {
    verso:
      '«Procura con diligencia presentarte a Dios aprobado, como obrero que no tiene de qué avergonzarse, que usa bien la palabra de verdad.» — 2 Timoteo 2:15',
    vivencia:
      'Te enseñamos herramientas prácticas para leer cada versículo en su contexto histórico, evitando interpretaciones aisladas o forzadas.',
  },
  vision: {
    verso:
      '«Lo que has oído de mí ante muchos testigos, esto encarga a hombres fieles que sean idóneos para enseñar también a otros.» — 2 Timoteo 2:2',
    vivencia:
      'Queremos que ni el horario laboral, ni la distancia física ni los costos económicos sean una barrera para profundizar en Dios.',
  },
  creencias: {
    verso:
      '«Y perseveraban en la doctrina de los apóstoles, en la comunión unos con otros, en el partimiento del pan y en las oraciones.» — Hechos 2:42',
    vivencia:
      'Aunque estudies online desde tu hogar, nunca estudiás solo: nuestros foros y pastores caminan con vos en cada duda.',
  },
};

export default async function InstitucionalPage() {
  const [user, { data: bloques }] = await Promise.all([
    getSessionUser(),
    listarInformacionInstitucional(),
  ]);

  return (
    <PublicShell user={user}>
      <ScrollGrowObserver />
      <div className="space-y-8">
        <div className="relative rounded-2xl overflow-hidden text-white p-6 sm:p-10 space-y-5 bg-[#241A13]">
          <img
            src="/images/hero-biblia.jpg"
            alt="Biblia abierta"
            className="absolute inset-0 w-full h-full object-cover object-center opacity-35"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#241A13]/95 via-[#241A13]/85 to-[#241A13]/65" />
          <div className="relative z-10 space-y-4 max-w-3xl">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#A46B29] text-white text-xs font-bold uppercase tracking-wider">
              <Heart className="w-3.5 h-3.5" />
              <span>Nuestras Doctrinas · RF-19</span>
            </span>
            <h1 className="text-3xl sm:text-4xl font-bold leading-tight">
              Lo que creemos, confesamos y vivimos en comunidad
            </h1>
            <p className="font-serif-editorial italic text-sm sm:text-base text-[#E9D5B5]">
              «Antes sed hacedores de la palabra, y no tan solamente oidores...»
              — Santiago 1:22
            </p>
            <div className="flex flex-wrap gap-2 pt-2">
              {bloques.map((b, idx) => (
                <a
                  key={b.id}
                  href={`#bloque-${b.id}`}
                  className="px-4 py-1.5 rounded-full text-xs font-semibold border border-[#E9D5B5]/45 text-[#FAF7F1] hover:bg-[#A46B29] hover:border-[#A46B29] transition-colors"
                >
                  0{idx + 1} · {b.titulo}
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {bloques.map((b, idx) => {
            const extra = VERSICULOS[b.tipo] ?? VERSICULOS.declaracion_fe;
            return (
              <article
                id={`bloque-${b.id}`}
                key={b.id}
                className="scroll-grow rounded-2xl overflow-hidden border border-[#E3DACB] bg-white shadow-sm"
              >
                <div
                  className="px-6 sm:px-8 py-5 text-white flex flex-wrap items-center justify-between gap-3"
                  style={{ backgroundColor: SHADES[idx % SHADES.length] }}
                >
                  <div className="flex items-center gap-4">
                    <span className="text-3xl font-bold leading-none text-[#F3DFC1]">
                      0{idx + 1}
                    </span>
                    <div>
                      <h2 className="text-xl sm:text-2xl font-bold">
                        {b.titulo}
                      </h2>
                      <div className="text-xs text-[#F3DFC1]">
                        {LABELS_TIPO_INSTITUCIONAL[b.tipo]}
                      </div>
                    </div>
                  </div>
                  <span className="text-xs px-3 py-1 rounded-full bg-black/20">
                    Actualizado: {formatFecha(b.fechaActualizacion)}
                  </span>
                </div>

                <div className="p-6 sm:p-8 space-y-5">
                  <blockquote className="font-serif-editorial italic text-sm sm:text-base text-[#7C4F1D] bg-[#FAF7F1] border-l-4 border-[#A46B29] px-4 py-3 rounded-r-xl">
                    {extra.verso}
                  </blockquote>

                  <div className="space-y-1.5">
                    <div className="text-xs font-bold uppercase tracking-wider text-[#A46B29]">
                      Qué creemos
                    </div>
                    <div className="font-serif-editorial text-base leading-loose text-[#2D221A] whitespace-pre-line">
                      {b.contenido}
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-[#F8EFE2]/70 border border-[#E4CCA8] text-sm text-[#4A3B2E]">
                    <strong className="text-[#7C4F1D]">
                      Cómo lo vivimos en tu formación:
                    </strong>{' '}
                    {extra.vivencia}
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[#66584B] pt-3 border-t border-[#E3DACB]">
                    <span>
                      Actualizado por: <strong>{b.actualizadoPor}</strong>
                    </span>
                    <Link
                      href="/cursos"
                      className="text-[#A46B29] font-semibold hover:underline"
                    >
                      Ver cursos relacionados →
                    </Link>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </PublicShell>
  );
}
