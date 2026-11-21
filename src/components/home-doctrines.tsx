'use client';

import * as React from 'react';
import Link from 'next/link';
import { ArrowDown, Heart } from 'lucide-react';

const DOCTRINAS_HOME = [
  {
    num: '01',
    etiqueta: 'Doctrina de las Escrituras',
    titulo: 'Creemos en la Palabra Viva de Dios',
    versiculo:
      '«Lámpara es a mis pies tu palabra, y lumbrera a mi camino.» — Salmo 119:105',
    confesion:
      'Confesamos la Biblia como la Palabra inspirada de Dios, fiel, suficiente y cercana para guiar nuestras decisiones, consolar el corazón y sostener toda nuestra enseñanza.',
    vivencia:
      'Por eso cada curso y cada prédica nace del texto bíblico abierto, invitándote a leer con calma y profundidad.',
    shade: '#9C6426',
  },
  {
    num: '02',
    etiqueta: 'Doctrina de Dios y la Gracia',
    titulo: 'Creemos en un Dios Trino y en la Salvación por Gracia',
    versiculo:
      '«Porque por gracia sois salvos por medio de la fe; y esto no de vosotros, pues es don de Dios.» — Efesios 2:8',
    confesion:
      'Adoramos a un solo Dios eterno —Padre, Hijo y Espíritu Santo— y celebramos el regalo inmerecido de la salvación obrada por Jesucristo en la cruz y su resurrección.',
    vivencia:
      'No nos acercamos a Dios por méritos propios; caminamos seguros en su amor, perdonados y reconciliados.',
    shade: '#784B1D',
  },
  {
    num: '03',
    etiqueta: 'Doctrina de la Vida Cristiana',
    titulo: 'Creemos en la Obra del Espíritu que Renueva',
    versiculo:
      '«Bástate mi gracia; porque mi poder se perfecciona en la debilidad.» — 2 Corintios 12:9',
    confesion:
      'Creemos que el Espíritu Santo habita en cada creyente para formar el carácter de Cristo, dar discernimiento en la Escritura y sostenernos aun en medio de las pruebas.',
    vivencia:
      'Nuestra formación busca transformar la mente y la vida cotidiana con humildad, oración y obediencia.',
    shade: '#543415',
  },
  {
    num: '04',
    etiqueta: 'Doctrina de la Iglesia y Esperanza',
    titulo: 'Creemos en la Comunión y el Regreso de Cristo',
    versiculo:
      '«Edificados sobre el fundamento de los apóstoles y profetas, siendo la principal piedra del ángulo Jesucristo mismo.» — Efesios 2:20',
    confesion:
      'Somos parte de una familia espiritual llamada a cuidarse mutuamente, celebrar el bautismo y la Cena del Señor, servir con amor y aguardar la venida gloriosa de Cristo.',
    vivencia:
      'Aunque estudies a tu ritmo desde casa, caminás acompañado por pastores, docentes y hermanos en los foros.',
    shade: '#311F10',
  },
];

export function HomeDoctrinesSection() {
  const [expanded, setExpanded] = React.useState<number>(0);

  return (
    <section
      id="landing-doctrinas"
      className="bg-[#E9E1D3] text-[#241A13] px-5 sm:px-12 py-14 sm:py-20"
    >
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="scroll-grow flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div className="space-y-2 max-w-2xl">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#88561D]">
              <Heart className="w-3.5 h-3.5" />
              <span>Lo que creemos y vivimos</span>
            </span>
            <h2 className="text-3xl sm:text-5xl font-bold tracking-tight leading-[1.06] text-[#241A13]">
              nuestras doctrinas
              <br />
              fundamentales
            </h2>
            <p className="text-sm text-[#57493D] leading-relaxed">
              No enseñamos teología como teoría fría: cada verdad doctrinal
              sostiene nuestra fe cotidiana y da sentido a nuestro caminar con
              Dios.
            </p>
          </div>
          <a
            href="#landing-profesores"
            className="w-10 h-10 rounded-full border border-[#241A13]/45 flex items-center justify-center text-[#241A13] hover:bg-[#241A13] hover:text-white transition-colors shrink-0"
            title="Bajar a profesores"
          >
            <ArrowDown className="w-4 h-4" />
          </a>
        </div>

        <div className="space-y-4">
          {DOCTRINAS_HOME.map((d, idx) => {
            const isOpen = expanded === idx;
            return (
              <article
                key={d.num}
                className="scroll-grow rounded-2xl overflow-hidden shadow-md border border-black/10 text-white"
                style={{ backgroundColor: d.shade }}
              >
                <div className="p-6 sm:p-8 space-y-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex items-start gap-4">
                      <span className="text-3xl sm:text-4xl font-bold leading-none text-[#F3DFC1] shrink-0">
                        {d.num}
                      </span>
                      <div>
                        <div className="text-xs font-semibold uppercase tracking-wider text-[#F3DFC1]">
                          {d.etiqueta}
                        </div>
                        <h3 className="text-xl sm:text-2xl font-bold mt-0.5">
                          {d.titulo}
                        </h3>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setExpanded(isOpen ? -1 : idx)}
                      className="px-3.5 py-1.5 rounded-full border border-white/40 text-xs font-semibold hover:bg-white hover:text-[#241A13] transition-colors shrink-0 cursor-pointer"
                    >
                      {isOpen ? 'Ocultar reflexión' : 'Leer reflexión personal'}
                    </button>
                  </div>

                  <blockquote className="font-serif-editorial italic text-sm sm:text-base text-[#FAF3E8] border-l-2 border-[#E9D5B5]/70 pl-4">
                    {d.versiculo}
                  </blockquote>

                  <p className="text-sm text-white/95 leading-relaxed">
                    {d.confesion}
                  </p>

                  {isOpen && (
                    <div className="pt-3 border-t border-white/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs sm:text-sm text-[#F8EFE2]">
                      <div>
                        <strong>En nuestra vida diaria:</strong> {d.vivencia}
                      </div>
                      <Link
                        href="/institucional"
                        className="shrink-0 px-4 py-1.5 rounded-full bg-white text-[#241A13] text-xs font-bold hover:bg-[#FAF7F1] text-center"
                      >
                        Ver en Doctrinas →
                      </Link>
                    </div>
                  )}
                </div>
              </article>
            );
          })}
        </div>

        <div className="scroll-grow flex flex-wrap items-center justify-between gap-4 pt-2">
          <div className="text-xs font-medium text-[#57493D]">
            ¿Querés leer nuestra Declaración de Fe y doctrina completa paso a
            paso?
          </div>
          <Link
            href="/institucional"
            className="px-5 py-2.5 rounded-full bg-[#241A13] text-white text-xs font-semibold uppercase tracking-wider hover:bg-[#A46B29] transition-colors"
          >
            Explorar Doctrinas Completas →
          </Link>
        </div>
      </div>
    </section>
  );
}
