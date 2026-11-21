'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { GraduationCap, Menu, X } from 'lucide-react';
import type { SessionUser } from '@/lib/auth/session';
import { BrandLogo } from './brand-logo';
import { BotGuiaWidget } from './bot-guia-widget';
import { SessionInactivityGuard } from './session-inactivity-guard';

const NAV_ITEMS = [
  { href: '/', label: 'Inicio' },
  { href: '/cursos', label: 'Cursos Online' },
  { href: '/predicas', label: 'Prédicas' },
  { href: '/institucional', label: 'Doctrinas' },
];

export function PublicShell({
  user,
  isLanding = false,
  children,
}: {
  user: SessionUser | null;
  isLanding?: boolean;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = React.useState(false);

  return (
    <div
      className={`min-h-screen flex flex-col ${
        isLanding ? 'bg-[#241A13]' : 'bg-[#FAF7F1]'
      }`}
    >
      <header
        className={`${
          isLanding ? 'bg-[#1F1610]/85 backdrop-blur-md' : 'bg-[#241A13]'
        } sticky top-0 z-30 border-b border-white/10 text-white`}
      >
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between gap-3">
          <BrandLogo href="/" />

          <nav className="hidden md:flex items-center gap-2">
            {NAV_ITEMS.map((item) => {
              const active =
                item.href === '/'
                  ? pathname === '/'
                  : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider border transition-colors ${
                    active
                      ? 'bg-[#A46B29] text-white border-[#A46B29]'
                      : 'border-[#E9D5B5]/50 text-[#FAF7F1] hover:border-[#E9D5B5] hover:bg-white/10'
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="hidden md:flex items-center gap-2">
            {user ? (
              <Link
                href={
                  user.rol === 'admin'
                    ? '/panel'
                    : user.rol === 'profesor'
                      ? '/gestion/cursos'
                      : '/mi-aprendizaje'
                }
                className="px-4 py-1.5 rounded-full bg-[#A46B29] text-white text-xs font-semibold uppercase tracking-wider hover:bg-[#88561D] flex items-center gap-1.5"
              >
                <GraduationCap className="w-3.5 h-3.5" />
                <span>Campus</span>
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="px-4 py-1.5 rounded-full border border-[#E9D5B5]/55 text-xs font-semibold uppercase tracking-wider text-[#FAF7F1] hover:bg-white/10"
                >
                  Ingresar
                </Link>
                <Link
                  href="/registro"
                  className="px-4 py-1.5 rounded-full bg-[#A46B29] text-white text-xs font-semibold uppercase tracking-wider hover:bg-[#88561D]"
                >
                  Registrarse
                </Link>
              </>
            )}
          </div>

          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            className="md:hidden p-2 rounded-full border border-[#E9D5B5]/45 text-[#FAF7F1]"
            aria-label="Menú"
          >
            {menuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>

        {menuOpen && (
          <div className="md:hidden border-t border-white/15 bg-[#241A13] px-4 py-4 space-y-3">
            <div className="flex flex-col gap-2">
              {NAV_ITEMS.map((item) => {
                const active =
                  item.href === '/'
                    ? pathname === '/'
                    : pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMenuOpen(false)}
                    className={`px-4 py-2 rounded-full text-xs font-semibold uppercase tracking-wider border text-center ${
                      active
                        ? 'bg-[#A46B29] text-white border-[#A46B29]'
                        : 'border-[#E9D5B5]/45 text-[#FAF7F1]'
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </div>
            <div className="pt-3 border-t border-white/15 flex gap-2">
              {user ? (
                <Link
                  href="/mi-aprendizaje"
                  onClick={() => setMenuOpen(false)}
                  className="flex-1 py-2 rounded-full bg-[#A46B29] text-white text-xs font-semibold uppercase text-center"
                >
                  Ir al Campus
                </Link>
              ) : (
                <>
                  <Link
                    href="/login"
                    onClick={() => setMenuOpen(false)}
                    className="flex-1 py-2 rounded-full border border-[#E9D5B5]/50 text-xs font-semibold uppercase text-center"
                  >
                    Ingresar
                  </Link>
                  <Link
                    href="/registro"
                    onClick={() => setMenuOpen(false)}
                    className="flex-1 py-2 rounded-full bg-[#A46B29] text-white text-xs font-semibold uppercase text-center"
                  >
                    Registrarse
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </header>

      {isLanding ? (
        <main className="flex-1 w-full">{children}</main>
      ) : (
        <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-6 sm:py-8">
          {children}
        </main>
      )}

      <footer className="bg-[#1C140E] text-[#CFC4B4] border-t border-white/10">
        <div className="max-w-6xl mx-auto px-4 py-10 grid grid-cols-1 sm:grid-cols-3 gap-8 text-sm">
          <div className="space-y-2.5">
            <BrandLogo href="/" compact />
            <p className="text-xs text-[#B3A593] leading-relaxed">
              Plataforma de formación teológica autodidacta. Educación continua,
              gratuita y asincrónica.
            </p>
          </div>
          <div className="space-y-2 text-xs">
            <div className="font-semibold text-[#FAF7F1] uppercase tracking-wider mb-1">
              Explorar
            </div>
            <div>
              <Link href="/cursos" className="text-[#B3A593] hover:text-white">
                Cursos Online
              </Link>
            </div>
            <div>
              <Link href="/predicas" className="text-[#B3A593] hover:text-white">
                Prédicas y Transcripciones
              </Link>
            </div>
            <div>
              <Link
                href="/institucional"
                className="text-[#B3A593] hover:text-white"
              >
                Nuestras Doctrinas
              </Link>
            </div>
          </div>
          <div className="space-y-2 text-xs">
            <div className="font-semibold text-[#FAF7F1] uppercase tracking-wider mb-1">
              Congregaciones
            </div>
            <div className="text-[#B3A593]">
              Sede Central San Miguel de Tucumán
            </div>
            <div className="text-[#B3A593]">Yerba Buena · Tafí Viejo</div>
            <div className="text-[#D4A366] font-medium">
              Abierto a estudiantes externos
            </div>
          </div>
        </div>
      </footer>

      {user && (
        <>
          <BotGuiaWidget />
          <SessionInactivityGuard />
        </>
      )}
    </div>
  );
}
