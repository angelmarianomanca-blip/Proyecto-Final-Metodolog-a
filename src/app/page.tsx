import Link from 'next/link';
import { ArrowRight, BookOpen } from 'lucide-react';
import { getSessionUser } from '@/lib/auth/session';
import { listarCursos } from '@/services/cursos';
import { PublicShell } from '@/components/public-shell';
import { ScrollGrowObserver } from '@/components/scroll-grow';
import { HomeDoctrinesSection } from '@/components/home-doctrines';
import { TeacherPortrait } from '@/components/teacher-portrait';
import { StatusBadge } from '@/components/ui/badge';

const PROFESORES = [
  {
    nombre: 'Pr. Marcos Herrera',
    especialidad: 'Doctrina Sistemática y Pastoral',
    descripcion:
      'Pastor principal en Sede Central Tucumán y docente con 15 años de trayectoria acompañando a creyentes en teología bíblica y homilética.',
  },
  {
    nombre: 'Dra. Laura Benítez',
    especialidad: 'Hermenéutica y Nuevo Testamento',
    descripcion:
      'Especialista en exégesis bíblica y géneros literarios del Nuevo Testamento. Directora de contenidos académicos y guías de estudio.',
  },
  {
    nombre: 'Pr. Daniel Sosa',
    especialidad: 'Eclesiología y Epístolas Paulinas',
    descripcion:
      'Docente y predicador enfocado en la vida de la iglesia local y estudios expositivos en Efesios, Romanos y Gálatas.',
  },
  {
    nombre: 'Lic. Tomás Aguirre',
    especialidad: 'Historia de la Iglesia y Credos',
    descripcion:
      'Investigador en patrística, confesiones históricas de fe y el legado de las primeras comunidades cristianas.',
  },
  {
    nombre: 'Lic. Carolina Méndez',
    especialidad: 'Antiguo Testamento y Sabiduría',
    descripcion:
      'Profesora de teología del Antiguo Testamento, Salmos y libros proféticos aplicada al devocional y la familia.',
  },
  {
    nombre: 'Pr. Samuel Pereyra',
    especialidad: 'Discipulado y Vida Práctica',
    descripcion:
      'Acompaña foros estudiantiles y seminarios prácticos sobre formación espiritual, carácter cristiano y servicio.',
  },
];

export default async function HomePage() {
  const user = await getSessionUser();
  const cursosRes = await listarCursos(user, { page: '1', pageSize: '4' });

  return (
    <PublicShell user={user} isLanding>
      <ScrollGrowObserver />
      <div className="w-full overflow-x-hidden">
        {/* HERO CON FOTO REAL DEL SANTUARIO + BOTON ANIMADO */}
        <section className="relative bg-[#1E1510] text-white min-h-[460px] flex flex-col items-center justify-center text-center px-5 py-16 overflow-hidden">
          <img
            src="/images/hero-biblia.jpg"
            alt="Biblia abierta en el santuario"
            className="absolute inset-0 w-full h-full object-cover object-center"
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                'linear-gradient(180deg, rgba(24,17,12,0.72) 0%, rgba(24,17,12,0.48) 46%, rgba(24,17,12,0.88) 100%)',
            }}
          />
          <div className="relative z-10 max-w-2xl mx-auto space-y-5">
            <span className="inline-block px-3.5 py-1 rounded-full bg-[#A46B29]/90 text-white text-xs font-semibold uppercase tracking-widest">
              Formación Teológica Autodidacta
            </span>
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight leading-[1.06] text-[#FAF7F1] drop-shadow-md">
              centro de
              <br />
              formación teológica
            </h1>

            <div className="pt-2 flex justify-center">
              <div className="relative inline-flex group">
                <div
                  className="btn-hero-aura absolute -inset-1.5 rounded-full blur-md pointer-events-none"
                  style={{
                    background:
                      'radial-gradient(circle, rgba(212,163,102,0.55) 0%, rgba(164,107,41,0.18) 65%, transparent 100%)',
                  }}
                />
                <Link
                  href="/cursos"
                  className="relative p-[2px] rounded-full overflow-hidden shadow-[0_14px_34px_-6px_rgba(164,107,41,0.6)] transition-all duration-300 group-hover:-translate-y-0.5 group-hover:scale-[1.03] active:scale-[0.98]"
                >
                  <span
                    className="btn-hero-ring pointer-events-none absolute top-1/2 left-1/2 w-[260%] aspect-square"
                    style={{
                      background:
                        'conic-gradient(from 0deg, transparent 0deg, transparent 210deg, #FAF0D7 285deg, #D4A366 330deg, transparent 360deg)',
                    }}
                  />
                  <span
                    className="relative flex items-center gap-3 px-5 sm:px-6 py-2.5 rounded-full overflow-hidden"
                    style={{
                      background:
                        'linear-gradient(135deg, #2D1E13 0%, #7C4F1D 52%, #A46B29 100%)',
                      boxShadow: 'inset 0 1px 0 rgba(255,245,220,0.38)',
                    }}
                  >
                    <span className="btn-hero-sheen pointer-events-none absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-white/35 to-transparent" />
                    <span className="relative z-10 w-6 h-6 rounded-full bg-[#FAF7F1]/15 border border-[#F7E3BA]/35 flex items-center justify-center text-[#F7E3BA] transition-transform duration-300 group-hover:rotate-6 group-hover:scale-110">
                      <BookOpen className="w-3.5 h-3.5" />
                    </span>
                    <span className="relative z-10 text-[#FAF7F1] font-bold tracking-[0.16em] group-hover:tracking-[0.20em] text-xs sm:text-sm uppercase transition-all duration-300">
                      ESTUDIA LA PALABRA
                    </span>
                    <span className="relative z-10 w-6 h-6 rounded-full bg-[#FAF7F1] text-[#241A13] flex items-center justify-center transition-transform duration-300 group-hover:translate-x-1">
                      <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </span>
                </Link>
              </div>
            </div>

            <p className="font-serif-editorial italic text-xs sm:text-sm text-[#E9D5B5] max-w-lg mx-auto">
              «Lámpara es a mis pies tu palabra, y lumbrera a mi camino.» —
              Salmo 119:105
            </p>
          </div>
        </section>

        {/* MANIFIESTO EN NOGAL PROFUNDO */}
        <section className="scroll-grow bg-[#241A13] text-[#FAF7F1] px-6 sm:px-12 py-14 sm:py-20 border-t border-white/10">
          <div className="max-w-5xl mx-auto space-y-12">
            <h2 className="text-3xl sm:text-5xl leading-[1.12] tracking-tight space-y-1">
              <div>
                <strong className="font-bold">escucha</strong>{' '}
                <span className="font-light text-[#E9D5B5]">su Palabra.</span>{' '}
                <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-[#A46B29] text-white align-middle ml-1">
                  <BookOpen className="w-4 h-4" />
                </span>
              </div>
              <div>
                <strong className="font-bold">afirma</strong>{' '}
                <span className="font-light text-[#E9D5B5]">
                  tu doctrina bíblica.
                </span>
              </div>
              <div>
                <strong className="font-bold">camina</strong>{' '}
                <span className="font-light text-[#E9D5B5]">
                  junto a tu iglesia.
                </span>
              </div>
            </h2>

            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 pt-4">
              <p className="text-sm sm:text-base text-[#D6CBB8] max-w-md leading-relaxed">
                <strong className="text-white">
                  Crece en intimidad con Dios
                </strong>{' '}
                a tu propio ritmo, con cursos claros, prédicas con transcripción
                completa y{' '}
                <strong className="text-white">acompañamiento cercano</strong>.
              </p>
              <div className="flex flex-col gap-2.5 w-full sm:w-auto">
                <Link
                  href="/cursos"
                  className="px-5 py-2 rounded-full border border-[#E9D5B5]/60 text-xs font-semibold uppercase tracking-wider text-white flex items-center justify-between gap-4 hover:bg-[#A46B29] hover:border-[#A46B29] transition-colors"
                >
                  <ArrowRight className="w-3.5 h-3.5" />
                  <span>EXPLORAR CURSOS ONLINE</span>
                </Link>
                <Link
                  href="/institucional"
                  className="px-5 py-2 rounded-full border border-[#E9D5B5]/60 text-xs font-semibold uppercase tracking-wider text-white flex items-center justify-between gap-4 hover:bg-white hover:text-[#241A13] transition-colors"
                >
                  <ArrowRight className="w-3.5 h-3.5" />
                  <span>CONOCER NUESTRAS DOCTRINAS</span>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* DOCTRINAS PERSONALES CON ANIMACION DE SCROLL */}
        <HomeDoctrinesSection />

        {/* CARPETA DE PROFESORES SOBRE FONDO AMBAR DORADO */}
        <section
          id="landing-profesores"
          className="bg-[#A46B29] px-4 sm:px-10 py-14 sm:py-20"
        >
          <div className="max-w-5xl mx-auto scroll-grow">
            <div className="flex items-end">
              <div className="bg-[#241A13] text-white px-6 sm:px-8 pt-6 pb-4 rounded-t-2xl">
                <h2 className="text-2xl sm:text-3xl leading-tight tracking-tight">
                  ¿qué <strong className="font-bold">profesores</strong> te
                  <br />
                  acompañan en este camino?
                </h2>
              </div>
              <div
                className="w-8 h-8 bg-[#241A13] hidden sm:block"
                style={{ clipPath: 'polygon(0 0, 0% 100%, 100% 100%)' }}
              />
            </div>

            <div className="bg-[#241A13] text-white p-5 sm:p-8 rounded-b-2xl rounded-tr-2xl shadow-2xl">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {PROFESORES.map((prof, idx) => (
                  <article
                    key={prof.nombre}
                    className="scroll-grow bg-[#2E2219] border border-white/10 rounded-xl overflow-hidden flex flex-col hover:border-[#D4A366] transition-colors"
                  >
                    <div className="relative aspect-[4/3] bg-[#3B2B20] overflow-hidden">
                      <TeacherPortrait idx={idx} />
                      <div className="absolute bottom-3 left-3.5 right-3.5">
                        <div className="font-semibold text-base text-white drop-shadow">
                          {prof.nombre}
                        </div>
                        <div className="text-xs text-[#E9D5B5] font-medium">
                          {prof.especialidad}
                        </div>
                      </div>
                    </div>
                    <div className="p-4 flex-1">
                      <p className="text-xs text-[#DFD5C5] leading-relaxed">
                        {prof.descripcion}
                      </p>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ACCESO DIRECTO A CURSOS PUBLICADOS DESDE BD */}
        <section className="bg-[#FAF7F1] text-[#241A13] px-5 sm:px-12 py-14">
          <div className="max-w-5xl mx-auto space-y-8 scroll-grow">
            <div className="flex flex-wrap items-end justify-between gap-3 border-b border-[#E3DACB] pb-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-[#A46B29]">
                  Acceso Libre y Gratuito
                </span>
                <h2 className="text-2xl sm:text-3xl font-bold mt-1">
                  Comenzá hoy un curso o escuchá una prédica
                </h2>
              </div>
              <div className="flex gap-2">
                <Link
                  href="/cursos"
                  className="px-4 py-1.5 rounded-full bg-[#241A13] text-white text-xs font-semibold hover:bg-[#A46B29]"
                >
                  Ver cursos
                </Link>
                <Link
                  href="/predicas"
                  className="px-4 py-1.5 rounded-full border border-[#241A13] text-xs font-semibold hover:bg-[#241A13] hover:text-white"
                >
                  Ver prédicas
                </Link>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {cursosRes.data.map((c) => (
                <div
                  key={c.id}
                  className="bg-white border border-[#E3DACB] rounded-2xl p-6 flex flex-col justify-between gap-4 hover:border-[#A46B29] transition-colors"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold text-[#A46B29]">
                        {c.profesor}
                      </span>
                      <StatusBadge status={c.estado} />
                    </div>
                    <h3 className="text-lg font-bold">{c.titulo}</h3>
                    <p className="text-sm text-[#66584B] line-clamp-2">
                      {c.descripcion}
                    </p>
                  </div>
                  <div className="pt-3 border-t border-[#E3DACB] flex items-center justify-between">
                    <span className="text-xs text-[#66584B]">
                      {c.totalModulos} módulos · {c.totalLecciones} lecciones
                    </span>
                    <Link
                      href={`/cursos/${c.id}`}
                      className="px-4 py-1.5 rounded-full bg-[#A46B29] text-white text-xs font-semibold hover:bg-[#88561D]"
                    >
                      Ver temario →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </PublicShell>
  );
}
